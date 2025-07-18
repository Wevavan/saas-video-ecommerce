export type UserPlan = 'free' | 'pro' | 'enterprise'
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type SubscriptionStatus = 'trialing' | 'active' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'cancelled' | 'unpaid'
export type VideoTemplate = 'slideshow' | 'zoom' | 'parallax' | 'fade' | 'custom'
export type VideoResolution = '720p' | '1080p' | '4K'
export type VideoFormat = 'mp4' | 'mov' | 'avi'
export type Currency = 'EUR' | 'USD' | 'GBP'
export type BillingInterval = 'month' | 'year'

export interface PlanFeatures {
  creditsPerMonth: number
  maxVideoLength: number
  hd: boolean
  watermark: boolean
  customTemplates: boolean
  priority: boolean
}

export const PLAN_CONFIGS: Record<UserPlan, PlanFeatures> = {
  free: {
    creditsPerMonth: 10,
    maxVideoLength: 30,
    hd: false,
    watermark: true,
    customTemplates: false,
    priority: false
  },
  pro: {
    creditsPerMonth: 100,
    maxVideoLength: 300,
    hd: true,
    watermark: false,
    customTemplates: true,
    priority: false
  },
  enterprise: {
    creditsPerMonth: 1000,
    maxVideoLength: 600,
    hd: true,
    watermark: false,
    customTemplates: true,
    priority: true
  }
}