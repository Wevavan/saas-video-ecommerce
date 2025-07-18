import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return
      }
      next(error)
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Erreur de validation des paramètres',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return
      }
      next(error)
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Erreur de validation des paramètres',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return
      }
      next(error)
    }
  }
}