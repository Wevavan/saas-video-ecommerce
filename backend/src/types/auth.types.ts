import { Request } from 'express'
import { IUser } from './user.types'

export interface AuthenticatedRequest extends Request {
  user?: IUser
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: IUser
  token?: string
  refreshToken?: string
}

export interface JWTPayload {
  userId: string
  email: string
  type: 'access' | 'refresh'
  iat: number
  exp: number
}