import { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'

// Interface pour les logs personnalisés
interface LogRequest extends Request {
  startTime?: number
}

// Middleware de logs personnalisé
export const requestLogger = (req: LogRequest, res: Response, next: NextFunction): void => {
  req.startTime = Date.now()
  
  // Log de début de requête
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`)
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📝 Body:`, JSON.stringify(req.body, null, 2))
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`🔍 Query:`, req.query)
  }

  // Log de fin de requête
  const originalSend = res.send
  res.send = function(data) {
    const duration = req.startTime ? Date.now() - req.startTime : 0
    console.log(`✅ ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`)
    
    // Si c'est une erreur, log les détails
    if (res.statusCode >= 400) {
      console.log(`❌ Error response:`, data)
    }
    
    return originalSend.call(this, data)
  }

  next()
}

// Configuration Morgan pour différents environnements
export const morganLogger = () => {
  if (process.env.NODE_ENV === 'development') {
    return morgan('dev')
  } else {
    return morgan('combined')
  }
}

// Middleware pour capturer les erreurs de parsing JSON
export const jsonErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('❌ JSON Parse Error:', err.message)
    res.status(400).json({
      success: false,
      message: 'JSON invalide dans le body de la requête',
      error: err.message
    })
    return
  }
  next(err)
}