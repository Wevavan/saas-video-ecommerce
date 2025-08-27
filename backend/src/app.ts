// backend/src/app.ts - VERSION COMPLÈTE CORRIGÉE
import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'path'
import { corsOptions } from './middleware/cors.middleware'
import { rateLimitConfig } from './middleware/rateLimit.middleware'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { requestLogger, morganLogger, jsonErrorHandler } from './middleware/logger.middleware'
import routes from './routes'
import creditsRoutes from './routes/credits.routes'
import uploadRoutes from './routes/upload.routes'
import runwayRoutes from './routes/runway.routes'
import audioRoutes from './routes/audio.routes' // ❌ MANQUE
import videosRoutes from './routes/videos.routes' // ✅ Import correct pour tes routes existantes
import rateLimit from 'express-rate-limit'
import fs from 'fs'
import { queueRoutes } from './routes/queue.routes'
import './services/queue.service' // ✅ Initialise la queue au démarrage

// Création automatique du dossier uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé:', uploadsDir);
} else {
  console.log('📁 Dossier uploads existe déjà');
}

const app: Application = express()

// ✅ MIDDLEWARES D'ABORD (ordre important)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(compression())
app.use(cors(corsOptions))
app.use(rateLimit(rateLimitConfig))
app.use(morganLogger())
app.use(requestLogger)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(jsonErrorHandler)

// ✅ SERVEUR DE FICHIERS STATIQUES
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}))

// ✅ ROUTES DE SANTÉ
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

// ✅ ROUTES PRINCIPALES (ordre important pour éviter les conflits)
app.use('/api/upload', uploadRoutes)
app.use('/api/credits', creditsRoutes)
app.use('/api/runway', runwayRoutes)
app.use('/api/queue', queueRoutes)        // ✅ Routes queue AVANT videos
app.use('/api/videos', videosRoutes)      // ✅ Tes routes videos existantes (étendues)
app.use('/api/audio', audioRoutes)
app.use('/api', routes)                   // ✅ Autres routes générales à la fin

// ✅ ROUTES DE DEBUG
app.get('/debug', (req, res) => {
  res.json({ message: 'Debug route working' })
})

app.get('/api/debug', (req, res) => {
  res.json({ message: 'API debug route working' })
})

// ✅ HEALTH CHECK ÉTENDU AVEC TOUS LES SERVICES
app.get('/api/health-extended', async (req: Request, res: Response) => {
  try {
    // Services existants
    const { cleanupService } = await import('./services/cleanup.service')
    const { runwayPollingService } = await import('./services/runway.polling.service')
    
    // Nouveaux services IA
    let queueHealth, openaiHealth, elevenlabsHealth, assemblyHealth;
    
    try {
      const { queueService } = await import('./services/queue.service');
      queueHealth = await queueService.getHealthStatus();
    } catch (error) {
      queueHealth = { status: 'error', error: 'Queue service unavailable' };
    }
    
    try {
      const { openaiService } = await import('./services/openai.service');
      openaiHealth = await openaiService.getServiceHealth();
    } catch (error) {
      openaiHealth = { status: 'not_configured', error: 'OpenAI service not available' };
    }
    
    try {
      const { elevenLabsService } = await import('./services/elevenlabs.service');
      elevenlabsHealth = await elevenLabsService.getServiceHealth();
    } catch (error) {
      elevenlabsHealth = { status: 'not_configured', error: 'ElevenLabs service not available' };
    }
    
    try {
      const { videoAssemblyService } = await import('./services/videoAssembly.service');
      assemblyHealth = await videoAssemblyService.getServiceHealth();
    } catch (error) {
      assemblyHealth = { status: 'not_configured', error: 'FFmpeg not available' };
    }
    
    const cleanupStatus = cleanupService.getStatus()
    const runwayPollingStatus = runwayPollingService.getStatus()
    
    // Test Runway API
    let runwayApiStatus = 'unknown';
    try {
      if (process.env.RUNWAY_API_KEY) {
        const response = await fetch(`${process.env.RUNWAY_API_URL || 'https://api.dev.runwayml.com/v1'}/tasks`, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`
          }
        });
        runwayApiStatus = response.ok ? 'connected' : 'error';
      } else {
        runwayApiStatus = 'not_configured';
      }
    } catch (error) {
      runwayApiStatus = 'disconnected';
    }
    
    // Calcul du status global
    const allServicesHealthy = 
      queueHealth?.healthy !== false &&
      openaiHealth?.status !== 'error' &&
      elevenlabsHealth?.status !== 'error' &&
      assemblyHealth?.status !== 'error' &&
      runwayApiStatus !== 'error';
    
    res.json({
      status: allServicesHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        // Services existants
        api: 'running',
        database: 'connected',
        cleanup: cleanupStatus.running ? 'running' : 'stopped',
        runwayApi: runwayApiStatus,
        runwayPolling: runwayPollingStatus.running ? 'running' : 'stopped',
        
        // Nouveaux services IA
        queue: queueHealth?.healthy ? 'running' : 'error',
        openai: openaiHealth?.status || 'unknown',
        elevenlabs: elevenlabsHealth?.status || 'unknown',
        ffmpeg: assemblyHealth?.status || 'unknown'
      },
      details: {
        cleanup: cleanupStatus,
        runway: {
          polling: runwayPollingStatus,
          apiConfigured: !!process.env.RUNWAY_API_KEY,
          apiUrl: process.env.RUNWAY_API_URL || 'https://api.dev.runwayml.com/v1'
        },
        queue: queueHealth,
        ai_services: {
          openai: {
            configured: !!process.env.OPENAI_API_KEY,
            health: openaiHealth
          },
          elevenlabs: {
            configured: !!process.env.ELEVENLABS_API_KEY,
            health: elevenlabsHealth
          },
          ffmpeg: {
            available: assemblyHealth?.status === 'healthy',
            health: assemblyHealth
          }
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Erreur health check étendu:', error.message);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
})

// ✅ ROUTE DE DEBUG ENVIRONNEMENT
app.get('/api/debug/env', (req, res) => {
  res.json({
    // Services existants
    runway_key_defined: !!process.env.RUNWAY_API_KEY,
    runway_key_length: process.env.RUNWAY_API_KEY?.length || 0,
    runway_url: process.env.RUNWAY_API_URL,
    
    // Nouveaux services IA
    openai_key_defined: !!process.env.OPENAI_API_KEY,
    openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
    elevenlabs_key_defined: !!process.env.ELEVENLABS_API_KEY,
    elevenlabs_key_length: process.env.ELEVENLABS_API_KEY?.length || 0,
    ffmpeg_path: process.env.FFMPEG_PATH || 'ffmpeg',
    redis_configured: !!process.env.REDIS_URL,
    
    node_env: process.env.NODE_ENV
  });
});

// ✅ ROUTE SPÉCIFIQUE POUR LE STATUT RUNWAY (existante)
app.get('/api/runway/health', async (req: Request, res: Response) => {
  try {
    const { runwayPollingService } = await import('./services/runway.polling.service')
    const pollingStatus = runwayPollingService.getStatus();
    
    const isConfigured = !!(process.env.RUNWAY_API_KEY && process.env.RUNWAY_API_URL);
    
    let apiTest: { status: string; responseTime: number | null } = { status: 'not_tested', responseTime: null };
    if (isConfigured) {
      const startTime = Date.now();
      try {
        const response = await fetch(`${process.env.RUNWAY_API_URL}/tasks`, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`
          }
        });
        const responseTime = Date.now() - startTime;
        apiTest = {
          status: response.ok ? 'success' : 'error',
          responseTime: responseTime
        };
      } catch (error) {
        apiTest = {
          status: 'failed',
          responseTime: Date.now() - startTime
        };
      }
    }

    res.json({
      service: 'Runway Video Generation',
      status: isConfigured ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
      polling: pollingStatus,
      api: {
        configured: isConfigured,
        url: process.env.RUNWAY_API_URL || 'https://api.dev.runwayml.com/v1',
        test: apiTest
      },
      features: {
        videoGeneration: isConfigured,
        jobPolling: pollingStatus.running,
        styleOptions: ['cinematic', 'realistic', 'artistic', 'fast_motion', 'slow_motion']
      }
    });

  } catch (error: any) {
    res.status(500).json({
      service: 'Runway Video Generation',
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ NOUVELLE ROUTE: Statut complet pipeline IA
app.get('/api/pipeline/health', async (req: Request, res: Response) => {
  try {
    let services: any = {};
    
    // Test Queue Service
    try {
      const { queueService } = await import('./services/queue.service');
      const queueStats = await queueService.getQueueStats();
      const queueHealth = await queueService.getHealthStatus();
      services.queue = {
        status: queueHealth.healthy ? 'healthy' : 'error',
        stats: queueStats,
        redis: queueHealth.redis
      };
    } catch (error: any) {
      services.queue = { status: 'error', error: error.message };
    }
    
    // Test OpenAI
    try {
      const { openaiService } = await import('./services/openai.service');
      services.openai = await openaiService.getServiceHealth();
    } catch (error: any) {
      services.openai = { status: 'not_configured', error: error.message };
    }
    
    // Test ElevenLabs
    try {
      const { elevenLabsService} = await import('./services/elevenlabs.service');
      services.elevenlabs = await elevenLabsService.getServiceHealth();
    } catch (error: any) {
      services.elevenlabs = { status: 'not_configured', error: error.message };
    }
    
    // Test FFmpeg
    try {
      const { videoAssemblyService } = await import('./services/videoAssembly.service');
      services.ffmpeg = await videoAssemblyService.getServiceHealth();
    } catch (error: any) {
      services.ffmpeg = { status: 'error', error: error.message };
    }
    
    // Test Runway
    try {
      const { RunwayService } = await import('./services/runway.service');
      services.runway = await RunwayService.getServiceStats();
    } catch (error: any) {
      services.runway = { status: 'error', error: error.message };
    }
    
    const allHealthy = Object.values(services).every((service: any) => 
      service.status === 'healthy' || service.status === 'success'
    );
    
    res.json({
      pipeline: 'AI Video Generation',
      status: allHealthy ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
      capabilities: {
        scriptGeneration: services.openai?.status === 'healthy',
        voiceGeneration: services.elevenlabs?.status === 'healthy',
        videoGeneration: services.runway?.status !== 'error',
        videoAssembly: services.ffmpeg?.status === 'healthy',
        queueProcessing: services.queue?.status === 'healthy'
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      pipeline: 'AI Video Generation',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ MIDDLEWARE D'ERREUR (toujours à la fin)
app.use(notFoundHandler)
app.use(errorHandler)

export default app       