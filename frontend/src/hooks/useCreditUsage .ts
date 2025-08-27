// frontend/src/hooks/useCreditUsage.ts

import { useState, useEffect, useCallback } from 'react';
import { CreditsApiService } from '../services/credits.service';
import { useAuth } from '../contexts/AuthContext';
import type { UsageDataPoint, UsageStats } from '../types/credits.types';

// Export des types pour faciliter l'utilisation
export type { UsageDataPoint, UsageStats };

export const useCreditUsage = (period: number = 7) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<UsageDataPoint[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Génère un tableau de dates pour la période demandée
   */
  const generateDateRange = useCallback((days: number): string[] => {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }, []);

  /**
   * Calcule les statistiques d'usage
   */
  const calculateStats = useCallback((usageData: UsageDataPoint[]): UsageStats => {
    const totalConsumed = usageData.reduce((sum, point) => sum + point.consumed, 0);
    const totalAdded = usageData.reduce((sum, point) => sum + point.added, 0);
    const avgDailyConsumption = usageData.length > 0 ? totalConsumed / usageData.length : 0;

    // Jour avec le plus de consommation
    const peakDay = usageData.reduce((peak, current) => 
      current.consumed > peak.consumed ? current : peak, 
      usageData[0] || { consumed: 0, date: '', added: 0, balance: 0 }
    );

    // Jour le plus actif (total d'activité)
    const mostActiveDay = usageData.reduce((active, current) => {
      const currentActivity = current.consumed + current.added;
      const activeActivity = active.consumed + active.added;
      return currentActivity > activeActivity ? current : active;
    }, usageData[0] || { consumed: 0, added: 0, date: '', balance: 0 });

    // Calcul de la tendance simple
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (usageData.length >= 7) {
      const firstHalf = usageData.slice(0, Math.floor(usageData.length / 2));
      const secondHalf = usageData.slice(Math.floor(usageData.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, point) => sum + point.consumed, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, point) => sum + point.consumed, 0) / secondHalf.length;
      
      const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
      
      if (change > 0.1) trend = 'increasing';
      else if (change < -0.1) trend = 'decreasing';
    }

    return {
      totalConsumed,
      totalAdded,
      avgDailyConsumption,
      peakConsumptionDay: peakDay.date,
      mostActiveDay: mostActiveDay.date,
      trend
    };
  }, []);

  /**
   * Charge les données d'usage depuis l'API
   */
  const loadUsageData = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Utilisateur non authentifié');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Générer la plage de dates
      const dateRange = generateDateRange(period);
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[dateRange.length - 1]);
      endDate.setHours(23, 59, 59, 999);

      // Charger l'historique pour la période
      const history = await CreditsApiService.getCreditHistory({
        page: 1,
        limit: 1000,
        startDate,
        endDate
      });

      // Initialiser les données par date
      const dataByDate: Record<string, { consumed: number; added: number }> = {};
      dateRange.forEach(date => {
        dataByDate[date] = { consumed: 0, added: 0 };
      });

      // Agréger les transactions par date
      history.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.createdAt).toISOString().split('T')[0];
        
        if (dataByDate[transactionDate]) {
          if (transaction.type === 'debit') {
            dataByDate[transactionDate].consumed += transaction.amount;
          } else if (transaction.type === 'credit') {
            dataByDate[transactionDate].added += transaction.amount;
          }
        }
      });

      // Calculer le solde initial
      const currentBalance = await CreditsApiService.getCurrentBalance();
      const transactionsAfterStart = history.transactions.filter(t => 
        new Date(t.createdAt) >= startDate
      );
      
      let runningBalance = transactionsAfterStart.reduce((balance, transaction) => {
        if (transaction.type === 'credit') {
          return balance - transaction.amount;
        } else {
          return balance + transaction.amount;
        }
      }, currentBalance.balance);

      // Construire les points du graphique
      const usageData: UsageDataPoint[] = dateRange.map(date => {
        const dayData = dataByDate[date];
        runningBalance = runningBalance + dayData.added - dayData.consumed;
        
        return {
          date,
          consumed: dayData.consumed,
          added: dayData.added,
          balance: Math.max(0, runningBalance)
        };
      });

      setData(usageData);
      setStats(calculateStats(usageData));
    } catch (err: any) {
      console.error('Erreur chargement données usage:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      setData([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, isAuthenticated, generateDateRange, calculateStats]);

  // Chargement initial
  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  return {
    data,
    stats,
    isLoading,
    error,
    refreshData: loadUsageData,
    
    // Méthodes utilitaires
    getUsageForDate: (date: string) => data.find(point => point.date === date),
    getTotalActivity: () => data.reduce((sum, point) => sum + point.consumed + point.added, 0),
    hasActivity: () => data.some(point => point.consumed > 0 || point.added > 0),
    
    // Prédictions simples
    predictNextWeekConsumption: () => {
      if (stats && stats.avgDailyConsumption > 0) {
        return Math.round(stats.avgDailyConsumption * 7);
      }
      return 0;
    },
    
    getDaysUntilEmpty: (currentBalance: number) => {
      if (stats && stats.avgDailyConsumption > 0) {
        return Math.floor(currentBalance / stats.avgDailyConsumption);
      }
      return Infinity;
    }
  };
};