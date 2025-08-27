// backend/src/middleware/auth.middleware.ts - VERSION SÉCURISÉE

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.model'
import { IUser } from '../types/user.types'

export interface AuthenticatedRequest extends Request {
  user?: IUser
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      })
      return
    }

    // 🔍 DEBUG - Vérifiez les secrets
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    console.log('🔑 Secret utilisé:', secret.substring(0, 10) + '...')

    // Décoder le token de manière sécurisée
    let decoded: any
    try {
      decoded = jwt.verify(token, secret)
    } catch (jwtError: any) {
      console.log('❌ JWT Error:', jwtError.message)
      res.status(401).json({
        success: false,
        message: 'Token invalide'
      })
      return
    }

    // Vérifier la structure du token
    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Token malformé'
      })
      return
    }

    console.log('✅ Token décodé:', { userId: decoded.userId, type: decoded.type })

    // Chercher l'utilisateur
    let user: any
    try {
      user = await User.findById(decoded.userId).select('-password')
    } catch (dbError: any) {
      console.log('❌ DB Error:', dbError.message)
      res.status(500).json({
        success: false,
        message: 'Erreur base de données'
      })
      return
    }
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      })
      return
    }

    console.log('✅ Utilisateur trouvé:', user.email)

    req.user = user as IUser
    next()
    
  } catch (error: any) {
    console.error('❌ Erreur générale middleware:', error.message)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise'
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      })
      return
    }

    next()
  }
}