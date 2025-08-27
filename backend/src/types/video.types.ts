// backend/src/types/video.types.ts - VERSION FUSIONNÉE
import { Document } from 'mongoose'

export interface IVideo extends Document {
  // ✅ TES PROPRIÉTÉS EXISTANTES
  title: string
  description?: string
  url?: string
  thumbnail?: string
  duration: number
  status: 'processing' | 'completed' | 'failed'
  userId: string
  templateId?: string
  settings?: Record<string, any>
  
  // 🆕 PROPRIÉTÉS IA AJOUTÉES
  jobId?: string
  script?: string
  outputVideo?: string
  inputImage?: string
  style?: string
  runwayJobId?: string
  generationStartedAt?: Date
  generationEndedAt?: Date
  error?: string
  creditsUsed?: number
  
  metadata?: {
    // ✅ TES PROPRIÉTÉS EXISTANTES
    resolution: string
    format: string
    size: number
    
    // 🆕 PROPRIÉTÉS IA AJOUTÉES
    creditCost?: number
    runwayJobId?: string
    productInfo?: {
      name?: string
      price?: number
      category?: string
      description?: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface VideoResponse {
  _id: string
  title: string
  description?: string
  url?: string
  thumbnail?: string
  duration: number
  status: string
  userId: string
  templateId?: string
  settings?: Record<string, any>
  
  // 🆕 PROPRIÉTÉS IA AJOUTÉES DANS LA RÉPONSE
  jobId?: string
  script?: string
  outputVideo?: string
  inputImage?: string
  style?: string
  generationStartedAt?: Date
  generationEndedAt?: Date
  error?: string
  
  metadata?: {
    resolution: string
    format: string
    size: number
    creditCost?: number
    productInfo?: {
      name?: string
      price?: number
      category?: string
      description?: string
    }
  }
  createdAt: Date
  updatedAt: Date
}