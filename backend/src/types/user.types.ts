import { Document } from 'mongoose'

export interface IUser extends Document {
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
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
  addCredits(amount: number): Promise<void>
  removeCredits(amount: number): Promise<boolean>
}

export interface UserResponse {
  _id: string
  name: string
  email: string
  role: string
  credits: number
  plan: string
  avatar?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}