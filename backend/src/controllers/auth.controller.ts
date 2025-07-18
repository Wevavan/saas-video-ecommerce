import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { LoginRequest, RegisterRequest } from '../types/auth.types'
import { sendResponse } from '../utils/response.util'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware'

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password }: RegisterRequest = req.body

      // Validation basique
      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          message: 'Email, mot de passe et nom requis'
        })
        return
      }

      // Validation email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        })
        return
      }

      const result = await AuthService.register(email, password, name)

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        user: result.user,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        })
        return
      }

      const result = await AuthService.login(email, password)

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: result.user,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      })
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message
      })
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Token de rafraîchissement requis'
        })
        return
      }

      const result = await AuthService.refreshAccessToken(refreshToken)

      res.status(200).json({
        success: true,
        message: 'Token rafraîchi avec succès',
        token: result.accessToken
      })
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message
      })
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Dans une implémentation plus avancée, on pourrait blacklister le token
      res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Appliquer le middleware d'authentification
      await new Promise<void>((resolve, reject) => {
        authenticateToken(req, res, (error) => {
          if (error) reject(error)
          else resolve()
        })
      })

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Utilisateur récupéré avec succès',
        user: req.user
      })
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message
      })
    }
  }
}

// Export par défaut pour compatibilité
export default AuthController