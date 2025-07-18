import { useState, useEffect, useCallback, useRef } from 'react';
import { CreditsApiService } from '../services/credits.service';
import { 
  CreditBalance, 
  CreditHistoryResponse, 
  ConsumeCreditsRequest
} from '../types/credits.types';
import { useAuth } from '../contexts/AuthContext';

export const useCredits = () => {
  const { user, refreshUser } = useAuth();
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
    if (!silent) setIsRefreshing(true);
    setError(null);

    try {
      const newBalance = await CreditsApiService.getCurrentBalance();
      setBalance(newBalance);
      
      // Mettre à jour aussi le contexte utilisateur
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur refresh balance:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [refreshUser]);

  /**
   * Charge l'historique des transactions
   */
  const loadHistory = useCallback(async (params: {
    page?: number;
    limit?: number;
    type?: 'credit' | 'debit';
    source?: string;
  } = {}) => {
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
  }, []);

  /**
   * Consomme des crédits
   */
  const consumeCredits = useCallback(async (request: ConsumeCreditsRequest) => {
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
  }, [balance, loadHistory, refreshUser]);

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

  // Initialisation et cleanup
  useEffect(() => {
    if (user) {
      // Charge initial
      refreshBalance();
      loadHistory({ page: 1, limit: 10 });
      
      // Démarre l'auto-refresh
      startAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [user, refreshBalance, loadHistory, startAutoRefresh, stopAutoRefresh]);

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
  }, [user?.credits]);

  return {
    // État
    balance: balance?.balance ?? user?.credits ?? 0,
    balanceData: balance,
    history,
    isLoading,
    isRefreshing,
    error,

    // Actions
    refreshBalance,
    loadHistory,
    consumeCredits,
    startAutoRefresh,
    stopAutoRefresh,

    // Helpers
    hasEnoughCredits: (amount: number) => (balance?.balance ?? user?.credits ?? 0) >= amount,
    isLowCredits: (threshold = 3) => (balance?.balance ?? user?.credits ?? 0) < threshold
  };
};