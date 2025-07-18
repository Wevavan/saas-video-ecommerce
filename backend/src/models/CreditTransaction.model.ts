import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'UserId requis'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Montant requis'],
    min: [0, 'Le montant doit être positif']
  },
  type: {
    type: String,
    enum: {
      values: ['credit', 'debit'],
      message: 'Type doit être credit ou debit'
    },
    required: [true, 'Type requis']
  },
  reason: {
    type: String,
    required: [true, 'Raison requise'],
    maxlength: [200, 'Raison maximum 200 caractères']
  },
  source: {
    type: String,
    enum: {
      values: ['registration', 'purchase', 'video_generation', 'admin', 'refund', 'bonus'],
      message: 'Source invalide'
    },
    required: [true, 'Source requise']
  },
  metadata: {
    orderId: String,
    videoId: String,
    adminId: String,
    stripePaymentId: String,
    description: String
  },
  balanceAfter: {
    type: Number,
    required: [true, 'Solde après transaction requis'],
    min: [0, 'Le solde ne peut pas être négatif']
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Index composé pour optimiser les requêtes par utilisateur et date
creditTransactionSchema.index({ userId: 1, createdAt: -1 });
creditTransactionSchema.index({ userId: 1, type: 1 });
creditTransactionSchema.index({ source: 1 });

export const CreditTransaction = mongoose.model<ICreditTransaction>('CreditTransaction', creditTransactionSchema);