import { Document } from 'mongoose'

export interface IVideo extends Document {
  title: string
  description?: string
  url?: string
  thumbnail?: string
  duration: number
  status: 'processing' | 'completed' | 'failed'
  userId: string
  templateId?: string
  settings?: Record<string, any>
  metadata?: {
    resolution: string
    format: string
    size: number
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
  metadata?: {
    resolution: string
    format: string
    size: number
  }
  createdAt: Date
  updatedAt: Date
}