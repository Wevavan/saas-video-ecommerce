
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
  message?: string;
}