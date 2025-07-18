// frontend/src/services/credits.service.ts - Version corrigée

import { apiService } from './api';
import {
  CreditBalance,
  CreditHistoryResponse,
  ConsumeCreditsRequest,
  CreditTransaction
} from '../types/credits.types';

export class CreditsApiService {
 
  /**
   * Obtient le solde actuel
   */
  static async getCurrentBalance(): Promise<CreditBalance> {
    try {
      const response = await apiService.get<any>('/credits');
     
      // Adapter selon la structure réelle de votre backend
      const data = response.data || response;
      
      if (response.success && data) {
        return data;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération du solde');
      }
    } catch (error: any) {
      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const message = error.response?.data?.message || error.message || 'Erreur réseau';
      throw new Error(message);
    }
  }

  /**
   * Consomme des crédits
   */
  static async consumeCredits(request: ConsumeCreditsRequest): Promise<{
    transaction: CreditTransaction;
    newBalance: number;
  }> {
    try {
      const response = await apiService.post<any>('/credits/consume', request);
     
      // Adapter selon la structure réelle de votre backend
      const data = response.data || response;
      
      if (response.success && data) {
        return data;
      } else {
        throw new Error(response.message || 'Erreur lors de la consommation');
      }
    } catch (error: any) {
      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const message = error.response?.data?.message || error.message || 'Erreur réseau';
      throw new Error(message);
    }
  }

  /**
   * Récupère l'historique des transactions
   */
  static async getCreditHistory(params: {
    page?: number;
    limit?: number;
    type?: 'credit' | 'debit';
    source?: string;
  } = {}): Promise<CreditHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
     
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.type) queryParams.append('type', params.type);
      if (params.source) queryParams.append('source', params.source);
      
      const url = `/credits/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiService.get<any>(url);
     
      // Adapter selon la structure réelle de votre backend
      const data = response.data || response;
      
      if (response.success && data) {
        return data as CreditHistoryResponse;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération de l\'historique');
      }
    } catch (error: any) {
      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const message = error.response?.data?.message || error.message || 'Erreur réseau';
      throw new Error(message);
    }
  }
}