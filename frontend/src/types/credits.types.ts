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

export interface ConsumeCreditsRequest {
  amount: number;
  reason: string;
  metadata?: {
    videoId?: string;
    description?: string;
  };
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  savings?: string;
  description: string;
}