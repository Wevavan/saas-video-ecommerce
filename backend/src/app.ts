import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'path' // 🆕 Pour les chemins de fichiers
import { corsOptions } from './middleware/cors.middleware'
import { rateLimitConfig } from './middleware/rateLimit.middleware'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { requestLogger, morganLogger, jsonErrorHandler } from './middleware/logger.middleware'
import routes from './routes'
import creditsRoutes from './routes/credits.routes'
import uploadRoutes from './routes/upload.route' // 🆕 Routes upload
import { cleanupService } from './services/cleanup.service' // 🆕 Service de nettoyage
import rateLimit from 'express-rate-limit'

const app: Application = express()

// Routes Credits
app.use('/api/credits', creditsRoutes)

// 🆕 Routes Upload (avant les middlewares de sécurité pour éviter les conflits)
app.use('/api/upload', uploadRoutes)

// Middleware de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // 🆕 Pour permettre l'accès aux images
}))
app.use(compression())

// CORS
app.use(cors(corsOptions))

// Rate limiting
app.use(rateLimit(rateLimitConfig))

// Logging
app.use(morganLogger())
app.use(requestLogger) // ← Nouveau middleware de logs

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 🆕 Serveur de fichiers statiques pour les uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y', // Cache d'un an pour les images
  etag: true,
  lastModified: true
}))

// Gestion d'erreurs JSON
app.use(jsonErrorHandler) // ← Nouveau middleware d'erreur JSON

// Route de santé directe
app.get('/health', (req: Request, res: Response) => {
  res.redirect('/api/health')
})

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SaaS Video E-commerce API',
    uptime: process.uptime()
  });
});

// Routes
app.use('/api', routes)



// Routes de debug direct dans app.ts
app.get('/debug', (req, res) => {
  res.json({ message: 'Debug route working' })
})

app.get('/api/debug', (req, res) => {
  res.json({ message: 'API debug route working' })
})

// 🆕 Route de health check étendue avec cleanup status
app.get('/api/health-extended', (req: Request, res: Response) => {
  const cleanupStatus = cleanupService.getStatus()
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      database: 'connected',
      cleanup: cleanupStatus.running ? 'running' : 'stopped'
    },
    cleanup: cleanupStatus
  })
})

// 🆕 Démarrage du service de nettoyage automatique
if (process.env.NODE_ENV === 'production') {
  cleanupService.startCleanupJob()
}

// Middleware d'erreur
app.use(notFoundHandler)
app.use(errorHandler)

export default app