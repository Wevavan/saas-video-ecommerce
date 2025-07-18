// backend/src/controllers/credits.controller.ts

import { Response, NextFunction } from 'express';
import { CreditsService } from '../services/credits.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ConsumeCreditsRequest, AddCreditsRequest, CreditHistoryQuery } from '../types/credit.types';

export class CreditsController {

  /**
   * GET /api/credits - Obtenir le solde actuel
   */
  static async getCurrentBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const balance = await CreditsService.getCurrentBalance(req.user._id.toString());

      res.status(200).json({
        success: true,
        message: 'Solde récupéré avec succès',
        data: balance
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/credits/consume - Consommer des crédits
   */
  static async consumeCredits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const { amount, reason, metadata }: ConsumeCreditsRequest = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être positif'
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'La raison est requise'
        });
      }

      const result = await CreditsService.consumeCredits(req.user._id.toString(), {
        amount,
        reason,
        metadata
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          transaction: result.transaction,
          newBalance: result.balance
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/credits/add - Ajouter des crédits (admin/stripe)
   */
  static async addCredits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, amount, source, metadata }: AddCreditsRequest = req.body;

      // Validation
      if (!userId || !amount || amount <= 0 || !source) {
        return res.status(400).json({
          success: false,
          message: 'UserId, montant positif et source requis'
        });
      }

      // Vérification des permissions (admin ou système)
      const isAdmin = req.user?.role === 'admin';
      const isSystemCall = req.headers['x-system-key'] === process.env.SYSTEM_SECRET_KEY;
      
      if (!isAdmin && !isSystemCall) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes'
        });
      }

      const result = await CreditsService.addCredits({
        userId,
        amount,
        source,
        metadata: {
          ...metadata,
          adminId: req.user?._id.toString()
        }
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          transaction: result.transaction,
          newBalance: result.balance
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/credits/history - Historique des transactions
   */
  static async getCreditHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const query: CreditHistoryQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        type: req.query.type as 'credit' | 'debit',
        source: req.query.source as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const history = await CreditsService.getCreditHistory(req.user._id.toString(), query);

      res.status(200).json({
        success: true,
        message: 'Historique récupéré avec succès',
        data: history
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/credits/stats - Statistiques globales (admin seulement)
   */
  static async getGlobalStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Accès administrateur requis'
        });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await CreditsService.getGlobalStats(startDate, endDate);

      res.status(200).json({
        success: true,
        message: 'Statistiques récupérées avec succès',
        data: stats
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}