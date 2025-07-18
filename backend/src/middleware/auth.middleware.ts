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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      })
      return
    }

    req.user = user as IUser // ← Cast explicite si nécessaire
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalide'
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