// frontend/src/hooks/useCredits.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { CreditsApiService } from '../services/credits.service';
import type { 
  CreditBalance, 
  CreditHistoryResponse, 
  ConsumeCreditsRequest
} from '../types/credits.types';
import { useAuth } from '../contexts/AuthContext';

interface UseCreditsReturn {
  // État
  balance: number;
  balanceData: CreditBalance | null;
  history: CreditHistoryResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  refreshBalance: () => Promise<void>;
  loadHistory: (params?: any) => Promise<void>;
  consumeCredits: (request: ConsumeCreditsRequest) => Promise<any>;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;

  // Helpers
  hasEnoughCredits: (amount: number) => boolean;
  isLowCredits: (threshold?: number) => boolean;
}

export const useCredits = (): UseCreditsReturn => {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [history, setHistory] = useState<CreditHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Référence pour l'interval de refresh
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Rafraîchit le solde depuis l'API
   */
  const refreshBalance = useCallback(async (silent = false) => {
    // Vérifier l'authentification avant l'appel
    if (!isAuthenticated || !user) {
      console.warn('User not authenticated, skipping balance refresh');
      return;
    }

    if (!silent) setIsRefreshing(true);
    setError(null);

    try {
      const newBalance = await CreditsApiService.getCurrentBalance();
      setBalance(newBalance);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur refresh balance:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Charge l'historique des transactions
   */
  const loadHistory = useCallback(async (params: {
    page?: number;
    limit?: number;
    type?: 'credit' | 'debit';
    source?: string;
  } = {}) => {
    // Vérifier l'authentification avant l'appel
    if (!isAuthenticated || !user) {
      console.warn('User not authenticated, skipping history load');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const historyData = await CreditsApiService.getCreditHistory(params);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Consomme des crédits
   */
  const consumeCredits = useCallback(async (request: ConsumeCreditsRequest) => {
    if (!isAuthenticated || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    setError(null);

    try {
      const result = await CreditsApiService.consumeCredits(request);
      
      // Mettre à jour le solde local immédiatement
      if (balance) {
        setBalance({
          ...balance,
          balance: result.newBalance,
          lastUpdated: new Date().toISOString()
        });
      }

      // Recharger l'historique pour voir la nouvelle transaction
      await loadHistory({ page: 1, limit: 10 });
      
      // Mettre à jour le contexte utilisateur
      await refreshUser();

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [balance, loadHistory, refreshUser, isAuthenticated, user]);

  /**
   * Auto-refresh périodique du solde
   */
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      refreshBalance(true); // Silent refresh
    }, intervalMs);
  }, [refreshBalance]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Initialisation et cleanup seulement si authentifié
  useEffect(() => {
    if (isAuthenticated && user) {
      // Charge initial
      refreshBalance();
      loadHistory({ page: 1, limit: 10 });
      
      // Démarre l'auto-refresh
      startAutoRefresh();
    } else {
      // Si plus authentifié, nettoyer
      setBalance(null);
      setHistory(null);
      setError(null);
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [isAuthenticated, user?._id, refreshBalance, loadHistory, startAutoRefresh, stopAutoRefresh]);

  // Sync avec le user du contexte auth
  useEffect(() => {
    if (user && user.credits !== undefined) {
      setBalance(prev => prev ? {
        ...prev,
        balance: user.credits
      } : {
        userId: user._id,
        balance: user.credits,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [user?.credits, user?._id]);

  return {
    // État
    balance: balance?.balance ?? user?.credits ?? 0,
    balanceData: balance,
    history,
    isLoading,
    isRefreshing,
    error,

    // Actions
    refreshBalance: () => refreshBalance(false),
    loadHistory,
    consumeCredits,
    startAutoRefresh,
    stopAutoRefresh,

    // Helpers
    hasEnoughCredits: (amount: number) => (balance?.balance ?? user?.credits ?? 0) >= amount,
    isLowCredits: (threshold = 3) => (balance?.balance ?? user?.credits ?? 0) < threshold
  };
};

// Export par défaut pour compatibilité
export default useCredits;