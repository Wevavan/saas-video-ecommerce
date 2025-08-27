// frontend/src/types/credits.types.ts

// Types de base pour les crédits
export interface CreditBalance {
  userId: string;
  balance: number;
  lastUpdated: string;
}

export interface CreditTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  source: 'registration' | 'purchase' | 'video_generation' | 'admin' | 'refund' | 'bonus';
  metadata?: {
    orderId?: string;
    videoId?: string;
    adminId?: string;
    stripePaymentId?: string;
    description?: string;
  };
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
}

// Types pour les requêtes API
export interface ConsumeCreditsRequest {
  amount: number;
  reason: string;
  metadata?: {
    videoId?: string;
    description?: string;
  };
}

export interface AddCreditsRequest {
  userId: string;
  amount: number;
  source: 'purchase' | 'admin' | 'refund' | 'bonus';
  metadata?: {
    orderId?: string;
    stripePaymentId?: string;
    adminId?: string;
    description?: string;
  };
}

export interface CreditHistoryQuery {
  page?: number;
  limit?: number;
  type?: 'credit' | 'debit';
  source?: string;
  startDate?: Date;
  endDate?: Date;
}

// Types pour les réponses API
export interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  summary: {
    totalCredits: number;
    totalDebits: number;
    netBalance: number;
  };
}

export interface CreditOperationResult {
  success: boolean;
  transaction?: CreditTransaction;
  balance: number;
  newBalance: number;
  message?: string;
}

export interface CreditGlobalStats {
  totalUsers: number;
  totalCreditsDistributed: number;
  totalCreditsConsumed: number;
  averageConsumptionPerUser: number;
  topConsumptionSources: Array<{
    source: string;
    count: number;
    totalAmount: number;
  }>;
  dailyStats: Array<{
    date: string;
    creditsAdded: number;
    creditsConsumed: number;
    newUsers: number;
  }>;
}

// Types pour les packages de crédits
export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  originalPrice?: number;
  description: string;
  popular?: boolean;
  savings?: string;
  features?: string[];
}

// Types pour les statistiques d'usage
export interface UsageDataPoint {
  date: string;
  consumed: number;
  added: number;
  balance: number;
}

export interface UsageStats {
  totalConsumed: number;
  totalAdded: number;
  avgDailyConsumption: number;
  peakConsumptionDay: string;
  mostActiveDay: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Types pour les alertes de crédits
export interface CreditAlert {
  type: 'low_balance' | 'insufficient' | 'depletion_warning';
  threshold: number;
  currentBalance: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// Types pour les prédictions
export interface CreditPrediction {
  nextWeekConsumption: number;
  daysUntilEmpty: number;
  recommendedTopUp: number;
  confidence: number; // 0-1
}

// Types pour l'historique des achats
export interface PurchaseHistory {
  id: string;
  packageId: string;
  credits: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentId?: string;
  createdAt: string;
  completedAt?: string;
}

// Types pour les paramètres de notification
export interface CreditNotificationSettings {
  lowBalanceAlert: boolean;
  lowBalanceThreshold: number;
  weeklyReport: boolean;
  purchaseConfirmation: boolean;
  emailNotifications: boolean;
}

// Types pour les métriques de performance
export interface CreditMetrics {
  averageTransactionValue: number;
  mostPopularPackage: string;
  conversionRate: number;
  retentionRate: number;
  lifetimeValue: number;
}

// Type pour l'état global des crédits dans le store
export interface CreditState {
  balance: CreditBalance | null;
  history: CreditHistoryResponse | null;
  usageData: UsageDataPoint[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetch: string | null;
}

// Types d'événements pour les crédits
export type CreditEventType = 
  | 'balance_updated'
  | 'transaction_created'
  | 'low_balance_alert'
  | 'purchase_completed'
  | 'credits_consumed';

export interface CreditEvent {
  type: CreditEventType;
  data: any;
  timestamp: string;
}

// Types pour les rapports
export interface CreditReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalConsumed: number;
    totalAdded: number;
    netChange: number;
    transactionCount: number;
  };
  breakdown: {
    bySource: Record<string, number>;
    byType: Record<string, number>;
    byDay: UsageDataPoint[];
  };
  insights: {
    averageDailyUsage: number;
    peakUsageDay: string;
    efficiency: number;
    recommendations: string[];
  };
}