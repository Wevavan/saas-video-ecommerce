// backend/src/services/credits.service.ts

import mongoose from 'mongoose';
import { User, IUser } from '../models/User.model';
import { CreditTransaction, ICreditTransaction } from '../models/CreditTransaction.model';
import { 
  CreditBalance, 
  ConsumeCreditsRequest, 
  AddCreditsRequest, 
  CreditHistoryQuery, 
  CreditHistoryResponse,
  CreditOperationResult 
} from '../types/credit.types';

export class CreditsService {
  
  /**
   * Vérifie si l'utilisateur a suffisamment de crédits
   */
  static async checkSufficientCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      return user.credits >= amount;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification des crédits: ${error}`);
    }
  }

  /**
   * Obtient le solde actuel de l'utilisateur
   */
  static async getCurrentBalance(userId: string): Promise<CreditBalance> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return {
        userId: user._id.toString(),
        balance: user.credits,
        lastUpdated: user.updatedAt
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du solde: ${error}`);
    }
  }

  /**
   * Consomme des crédits avec transaction atomique
   */
  static async consumeCredits(
  userId: string, 
  request: ConsumeCreditsRequest
): Promise<CreditOperationResult> {
  console.log('🔍 Début consumeCredits:', { userId, amount: request.amount, reason: request.reason });
  
  const session = await mongoose.startSession();
  
  try {
    let result: CreditOperationResult | null = null;
    
    // Utiliser withTransaction avec une approche plus simple
    await session.withTransaction(async () => {
      // Vérifier et récupérer l'utilisateur
      const user = await User.findById(userId).session(session);
      console.log('👤 Utilisateur trouvé:', { 
        id: user?._id, 
        email: user?.email, 
        credits: user?.credits 
      });
      
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier les crédits suffisants
      if (user.credits < request.amount) {
        console.log('❌ Crédits insuffisants:', { 
          userCredits: user.credits, 
          demandés: request.amount 
        });
        throw new Error(`Crédits insuffisants. Solde: ${user.credits}, Requis: ${request.amount}`);
      }

      // Décrémenter les crédits
      const newBalance = user.credits - request.amount;
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { credits: newBalance },
        { session, new: true }
      );
      
      console.log('✅ Utilisateur mis à jour:', { 
        nouveauSolde: updatedUser?.credits 
      });

      // Créer la transaction
      const transaction = new CreditTransaction({
        userId,
        amount: request.amount,
        type: 'debit',
        reason: request.reason,
        source: 'video_generation',
        metadata: request.metadata,
        balanceAfter: newBalance
      });

      const savedTransaction = await transaction.save({ session });
      console.log('✅ Transaction créée:', savedTransaction._id);

      // Stocker le résultat dans la variable externe
      result = {
        success: true,
        transaction: savedTransaction.toJSON(),
        balance: newBalance,
        message: `${request.amount} crédit${request.amount > 1 ? 's' : ''} consommé${request.amount > 1 ? 's' : ''} avec succès`
      };
    });

    console.log('✅ Transaction MongoDB terminée avec succès');
    
    // Vérifier que le résultat a bien été défini
    if (!result) {
      throw new Error('Aucun résultat retourné par la transaction');
    }

    return result;
    
  } catch (error: any) {
    console.error('❌ Erreur dans consumeCredits:', error.message);
    return {
      success: false,
      balance: 0,
      message: error.message
    };
  } finally {
    await session.endSession();
  }
}

  /**
   * Ajoute des crédits avec transaction atomique
   */
  static async addCredits(request: AddCreditsRequest): Promise<CreditOperationResult> {
    const session = await mongoose.startSession();
    
    try {
      // Définir la fonction de transaction avec un type explicite
      const transactionFn = async (): Promise<CreditOperationResult> => {
        // Vérifier et récupérer l'utilisateur
        const user = await User.findById(request.userId).session(session);
        if (!user) {
          throw new Error('Utilisateur non trouvé');
        }

        // Incrémenter les crédits
        const newBalance = user.credits + request.amount;
        await User.findByIdAndUpdate(
          request.userId, 
          { credits: newBalance },
          { session, new: true }
        );

        // Créer la transaction
        const transaction = new CreditTransaction({
          userId: request.userId,
          amount: request.amount,
          type: 'credit',
          reason: this.getReasonForSource(request.source, request.amount),
          source: request.source,
          metadata: request.metadata,
          balanceAfter: newBalance
        });

        await transaction.save({ session });

        const result: CreditOperationResult = {
          success: true,
          transaction: transaction.toJSON(),
          balance: newBalance,
          message: `${request.amount} crédits ajoutés avec succès`
        };

        return result;
      };

      // Exécuter la transaction
      const result = await session.withTransaction(transactionFn);
      
      // Vérifier le résultat et le typer explicitement
      if (!result || typeof result !== 'object' || !('success' in result)) {
        throw new Error('Transaction échouée - résultat invalide');
      }

      return result as CreditOperationResult;
    } catch (error: any) {
      return {
        success: false,
        balance: 0,
        message: error.message
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Récupère l'historique des transactions avec pagination
   */
  static async getCreditHistory(
    userId: string, 
    query: CreditHistoryQuery = {}
  ): Promise<CreditHistoryResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        source,
        startDate,
        endDate
      } = query;

      // Construire le filtre
      const filter: any = { userId };
      
      if (type) filter.type = type;
      if (source) filter.source = source;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      // Pagination
      const skip = (page - 1) * limit;
      
      // Requêtes parallèles
      const [transactions, totalCount] = await Promise.all([
        CreditTransaction.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CreditTransaction.countDocuments(filter)
      ]);

      // Calculer les totaux
      const summary = await this.calculateSummary(userId, filter);

      return {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        },
        summary
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'historique: ${error}`);
    }
  }

  /**
   * Calcule le résumé des transactions
   */
  private static async calculateSummary(userId: string, filter: any) {
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ];

    const results = await CreditTransaction.aggregate(pipeline);
    
    let totalCredits = 0;
    let totalDebits = 0;

    results.forEach(result => {
      if (result._id === 'credit') {
        totalCredits = result.total;
      } else if (result._id === 'debit') {
        totalDebits = result.total;
      }
    });

    return {
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits
    };
  }

  /**
   * Génère une raison selon la source
   */
  private static getReasonForSource(source: string, amount: number): string {
    switch (source) {
      case 'registration':
        return 'Crédits de bienvenue lors de l\'inscription';
      case 'purchase':
        return `Achat de ${amount} crédits`;
      case 'admin':
        return `Ajout administrateur de ${amount} crédits`;
      case 'refund':
        return `Remboursement de ${amount} crédits`;
      case 'bonus':
        return `Bonus de ${amount} crédits`;
      default:
        return `Ajout de ${amount} crédits`;
    }
  }

  /**
   * Statistiques pour l'admin
   */
  static async getGlobalStats(startDate?: Date, endDate?: Date) {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        if (startDate) dateFilter.$gte = startDate;
        if (endDate) dateFilter.$lte = endDate;
      }

      const filter = dateFilter ? { createdAt: dateFilter } : {};

      const stats = await CreditTransaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              type: '$type',
              source: '$source'
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            sources: {
              $push: {
                source: '$_id.source',
                total: '$total',
                count: '$count'
              }
            },
            totalAmount: { $sum: '$total' },
            totalTransactions: { $sum: '$count' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Erreur lors du calcul des statistiques: ${error}`);
    }
  }
}