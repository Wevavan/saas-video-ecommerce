// frontend/src/services/credits.service.ts

import { apiService } from './api';
import type {
  CreditBalance,
  CreditHistoryResponse,
  CreditHistoryQuery,
  ConsumeCreditsRequest,
  AddCreditsRequest,
  CreditOperationResult,
  CreditGlobalStats
} from '../types/credits.types';

export class CreditsApiService {
  private static readonly BASE_URL = '/credits';

  /**
   * Obtient le solde actuel de crédits de l'utilisateur connecté
   */
  static async getCurrentBalance(): Promise<CreditBalance> {
    try {
      const response = await apiService.get<CreditBalance>(this.BASE_URL);
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération du solde');
      }

      // La donnée peut être dans response.data ou directement dans response selon l'API
      return response.data || response as any;
    } catch (error: any) {
      console.error('Error fetching credit balance:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Session expirée - Veuillez vous reconnecter');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Trop de requêtes - Attendez avant de réessayer');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur lors de la récupération du solde'
      );
    }
  }

  /**
   * Consomme des crédits pour l'utilisateur connecté
   */
  static async consumeCredits(request: ConsumeCreditsRequest): Promise<CreditOperationResult> {
    try {
      // Validation côté client
      if (!request.amount || request.amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      if (!request.reason?.trim()) {
        throw new Error('La raison est requise');
      }

      const response = await apiService.post<CreditOperationResult>(`${this.BASE_URL}/consume`, request);
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la consommation de crédits');
      }

      // Adapter la réponse selon la structure de votre API
      const responseData = response.data || response as any;
      return {
        success: true,
        transaction: responseData.transaction,
        balance: responseData.newBalance,
        newBalance: responseData.newBalance,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error consuming credits:', error);
      
      if (error.response?.status === 400) {
        // Erreur de validation ou solde insuffisant
        throw new Error(error.response.data.message || 'Données invalides');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Trop de consommations - Attendez avant de réessayer');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur lors de la consommation de crédits'
      );
    }
  }

  /**
   * Ajoute des crédits (réservé aux admins ou système de paiement)
   */
  static async addCredits(request: AddCreditsRequest): Promise<CreditOperationResult> {
    try {
      const response = await apiService.post<CreditOperationResult>(`${this.BASE_URL}/add`, request);
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'ajout de crédits');
      }

      const responseData = response.data || response as any;
      return {
        success: true,
        transaction: responseData.transaction,
        balance: responseData.newBalance,
        newBalance: responseData.newBalance,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error adding credits:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Permissions insuffisantes');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur lors de l\'ajout de crédits'
      );
    }
  }

  /**
   * Récupère l'historique des transactions de crédits
   */
  static async getCreditHistory(query: CreditHistoryQuery = {}): Promise<CreditHistoryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.type) params.append('type', query.type);
      if (query.source) params.append('source', query.source);
      if (query.startDate) params.append('startDate', query.startDate.toISOString());
      if (query.endDate) params.append('endDate', query.endDate.toISOString());

      const url = `${this.BASE_URL}/history${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiService.get<CreditHistoryResponse>(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération de l\'historique');
      }

      return response.data || response as any;
    } catch (error: any) {
      console.error('Error fetching credit history:', error);
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur lors de la récupération de l\'historique'
      );
    }
  }

  /**
   * Récupère les statistiques globales (réservé aux admins)
   */
  static async getGlobalStats(startDate?: Date, endDate?: Date): Promise<CreditGlobalStats> {
    try {
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const url = `${this.BASE_URL}/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiService.get<CreditGlobalStats>(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
      }

      return response.data || response as any;
    } catch (error: any) {
      console.error('Error fetching global stats:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Accès administrateur requis');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur lors de la récupération des statistiques'
      );
    }
  }

  /**
   * Méthodes utilitaires pour les prédictions et analyses
   */
  
  /**
   * Calcule les tendances d'usage basées sur l'historique
   */
  static async getUsageTrends(days: number = 30): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    weeklyAverage: number;
    predictedNextWeek: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const history = await this.getCreditHistory({
        startDate,
        endDate,
        type: 'debit', // Seulement les consommations
        limit: 1000
      });

      // Grouper par semaine
      const weeklyConsumption: Record<string, number> = {};
      
      history.transactions.forEach(transaction => {
        const date = new Date(transaction.createdAt);
        const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        weeklyConsumption[week] = (weeklyConsumption[week] || 0) + transaction.amount;
      });

      const weeks = Object.values(weeklyConsumption);
      const weeklyAverage = weeks.length > 0 ? weeks.reduce((a, b) => a + b, 0) / weeks.length : 0;
      
      // Calcul de tendance simple (compare les 2 dernières semaines)
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (weeks.length >= 2) {
        const lastWeek = weeks[weeks.length - 1];
        const previousWeek = weeks[weeks.length - 2];
        const change = (lastWeek - previousWeek) / previousWeek;
        
        if (change > 0.1) trend = 'increasing';
        else if (change < -0.1) trend = 'decreasing';
      }

      return {
        trend,
        weeklyAverage,
        predictedNextWeek: Math.round(weeklyAverage * (trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1))
      };
    } catch (error) {
      console.error('Error calculating usage trends:', error);
      return {
        trend: 'stable',
        weeklyAverage: 0,
        predictedNextWeek: 0
      };
    }
  }

  /**
   * Vérifie si l'utilisateur a suffisamment de crédits
   */
  static async hasEnoughCredits(requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getCurrentBalance();
      return balance.balance >= requiredAmount;
    } catch (error) {
      console.error('Error checking credit sufficiency:', error);
      return false;
    }
  }

  /**
   * Obtient des recommandations d'achat basées sur l'usage
   */
  static async getPurchaseRecommendations(): Promise<{
    recommended: boolean;
    reason: string;
    suggestedAmount: number;
    urgency: 'low' | 'medium' | 'high';
  }> {
    try {
      const [balance, trends] = await Promise.all([
        this.getCurrentBalance(),
        this.getUsageTrends(14)
      ]);

      const daysLeft = trends.weeklyAverage > 0 ? (balance.balance / (trends.weeklyAverage / 7)) : Infinity;
      
      let urgency: 'low' | 'medium' | 'high' = 'low';
      let recommended = false;
      let reason = 'Votre solde est suffisant';
      let suggestedAmount = 0;

      if (daysLeft < 3) {
        urgency = 'high';
        recommended = true;
        reason = 'Solde critique - Rechargez immédiatement';
        suggestedAmount = Math.max(trends.predictedNextWeek * 2, 50);
      } else if (daysLeft < 7) {
        urgency = 'medium';
        recommended = true;
        reason = 'Solde faible - Rechargez bientôt';
        suggestedAmount = Math.max(trends.predictedNextWeek, 25);
      } else if (daysLeft < 14) {
        urgency = 'low';
        recommended = true;
        reason = 'Considérez un rechargement préventif';
        suggestedAmount = trends.predictedNextWeek;
      }

      return {
        recommended,
        reason,
        suggestedAmount,
        urgency
      };
    } catch (error) {
      console.error('Error getting purchase recommendations:', error);
      return {
        recommended: false,
        reason: 'Erreur lors du calcul des recommandations',
        suggestedAmount: 0,
        urgency: 'low'
      };
    }
  }
}