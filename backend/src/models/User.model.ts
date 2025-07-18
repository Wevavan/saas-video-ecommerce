import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends mongoose.Document {
  email: string
  password: string
  name: string
  role: 'user' | 'admin'
  credits: number
  plan: 'free' | 'pro' | 'enterprise'
  subscription?: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    status: 'active' | 'inactive' | 'cancelled' | 'past_due'
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
  }
  profile: {
    avatar?: string
    company?: string
    phone?: string
  }
  settings: {
    notifications: boolean
    emailMarketing: boolean
    language: string
  }
  isVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  lastLoginAt?: Date  // ← Cette propriété existe déjà dans votre modèle
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
  addCredits(amount: number): Promise<void>
  removeCredits(amount: number): Promise<boolean>
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [6, 'Mot de passe minimum 6 caractères'],
    select: false // Ne pas inclure par défaut dans les requêtes
  },
  name: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true,
    maxlength: [100, 'Nom maximum 100 caractères']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role doit être user ou admin'
    },
    default: 'user'
  },
  credits: {
    type: Number,
    default: 10, // Crédits gratuits au démarrage
    min: [0, 'Les crédits ne peuvent pas être négatifs']
  },
  plan: {
    type: String,
    enum: {
      values: ['free', 'pro', 'enterprise'],
      message: 'Plan doit être free, pro ou enterprise'
    },
    default: 'free'
  },
  subscription: {
    stripeCustomerId: {
      type: String,
      sparse: true // Permet les valeurs nulles uniques
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'inactive'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date
  },
  profile: {
    avatar: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v)
        },
        message: 'Avatar doit être une URL valide'
      }
    },
    company: {
      type: String,
      maxlength: [100, 'Nom de société maximum 100 caractères']
    },
    phone: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^\+?[\d\s-()]{10,}$/.test(v)
        },
        message: 'Numéro de téléphone invalide'
      }
    }
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    emailMarketing: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'fr',
      enum: ['fr', 'en', 'es', 'de']
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password
      delete ret.emailVerificationToken
      delete ret.passwordResetToken
      delete ret.__v
      return ret
    }
  }
})

// Index pour performance
userSchema.index({ email: 1 })
userSchema.index({ 'subscription.stripeCustomerId': 1 })
userSchema.index({ plan: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ lastLoginAt: -1 })

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Méthode pour ajouter des crédits
userSchema.methods.addCredits = async function(amount: number): Promise<void> {
  this.credits += amount
  await this.save()
}

// Méthode pour retirer des crédits
userSchema.methods.removeCredits = async function(amount: number): Promise<boolean> {
  if (this.credits < amount) {
    return false // Pas assez de crédits
  }
  this.credits -= amount
  await this.save()
  return true
}

export const User = mongoose.model<IUser>('User', userSchema)