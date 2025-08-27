// backend/src/types/credit.types.ts

export interface CreditBalance {
  userId: string;
  balance: number;
  lastUpdated: Date;
}

export interface ConsumeCreditsRequest {
  amount: number;
  reason: string;
  metadata?: {
    videoId?: string;
    taskId?: string;
    description?: string;
    imageUrl?: string;
    style?: string;
    prompt?: string;
    runwayJobId?: string; // ✅ Ajouté
    originalVideoId?: string; // ✅ Ajouté
    creditCost?: number; // ✅ Ajouté
    [key: string]: any; // ✅ Permet d'autres propriétés
  };
}

export interface AddCreditsRequest {
  userId: string;
  amount: number;
  source: 'registration' | 'purchase' | 'admin' | 'refund' | 'bonus' | 'test';
  metadata?: {
    reason?: string;
    orderId?: string;
    transactionId?: string;
    adminUserId?: string;
    originalVideoId?: string; // ✅ Ajouté
    runwayJobId?: string; // ✅ Ajouté
    [key: string]: any; // ✅ Permet d'autres propriétés
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

export interface CreditHistoryResponse {
  transactions: any[];
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
  transaction?: any;
  balance: number;
  message: string;
}

export interface CreditUsageStats {
  totalUsed: number;
  byCategory: {
    [category: string]: number;
  };
  recentTransactions: any[];
  projectedUsage?: number;
}