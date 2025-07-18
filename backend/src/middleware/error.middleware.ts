import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export interface CustomError extends Error {
  statusCode?: number
  errors?: any[]
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Erreur interne du serveur'
  let errors: any[] = []

  // Erreur de validation Zod
  if (error instanceof ZodError) {
    statusCode = 400
    message = 'Erreur de validation'
    errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }))
  }

  // Erreur MongoDB duplicate key
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 400
    message = 'Ressource déjà existante'
  }

  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Token invalide'
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expiré'
  }

  // Log de l'erreur
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur:', error)
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} introuvable`
  })
}