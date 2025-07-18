import mongoose, { Schema } from 'mongoose'

export interface ISubscription extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  plan: {
    name: 'free' | 'pro' | 'enterprise'
    creditsPerMonth: number
    price: number
    currency: string
    features: string[]
  }
  status: 'trialing' | 'active' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'cancelled' | 'unpaid'
  billing: {
    interval: 'month' | 'year'
    intervalCount: number
    currentPeriodStart: Date
    currentPeriodEnd: Date
    trialStart?: Date
    trialEnd?: Date
    cancelAtPeriodEnd: boolean
    canceledAt?: Date
    endedAt?: Date
  }
  payment: {
    paymentMethodId?: string
    lastPaymentDate?: Date
    nextPaymentDate?: Date
    failedAttempts: number
    lastFailureReason?: string
  }
  usage: {
    creditsUsed: number
    creditsRemaining: number
    videosGenerated: number
    lastResetDate: Date
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID utilisateur requis'],
    unique: true // Un utilisateur = une subscription
  },
  stripeCustomerId: {
    type: String,
    required: [true, 'ID client Stripe requis'],
    unique: true
  },
  stripeSubscriptionId: {
    type: String,
    required: [true, 'ID subscription Stripe requis'],
    unique: true
  },
  stripePriceId: {
    type: String,
    required: [true, 'ID prix Stripe requis']
  },
  plan: {
    name: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      required: [true, 'Nom du plan requis']
    },
    creditsPerMonth: {
      type: Number,
      required: [true, 'Crédits par mois requis'],
      min: 0
    },
    price: {
      type: Number,
      required: [true, 'Prix requis'],
      min: 0
    },
    currency: {
      type: String,
      required: [true, 'Devise requise'],
      enum: ['EUR', 'USD', 'GBP'],
      default: 'EUR'
    },
    features: [{
      type: String,
      trim: true
    }]
  },
  status: {
    type: String,
    enum: ['trialing', 'active', 'incomplete', 'incomplete_expired', 'past_due', 'cancelled', 'unpaid'],
    required: [true, 'Statut requis'],
    index: true
  },
  billing: {
    interval: {
      type: String,
      enum: ['month', 'year'],
      required: [true, 'Intervalle de facturation requis']
    },
    intervalCount: {
      type: Number,
      default: 1,
      min: 1
    },
    currentPeriodStart: {
      type: Date,
      required: [true, 'Début de période requis']
    },
    currentPeriodEnd: {
      type: Date,
      required: [true, 'Fin de période requise']
    },
    trialStart: Date,
    trialEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    canceledAt: Date,
    endedAt: Date
  },
  payment: {
    paymentMethodId: String,
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    lastFailureReason: String
  },
  usage: {
    creditsUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    creditsRemaining: {
      type: Number,
      default: 0,
      min: 0
    },
    videosGenerated: {
      type: Number,
      default: 0,
      min: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Index pour performance
subscriptionSchema.index({ userId: 1 })
subscriptionSchema.index({ stripeCustomerId: 1 })
subscriptionSchema.index({ stripeSubscriptionId: 1 })
subscriptionSchema.index({ status: 1 })
subscriptionSchema.index({ 'billing.currentPeriodEnd': 1 })
subscriptionSchema.index({ 'billing.nextPaymentDate': 1 })

// Index composé
subscriptionSchema.index({ userId: 1, status: 1 })

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema)