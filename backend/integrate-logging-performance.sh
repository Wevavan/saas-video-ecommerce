#!/bin/bash
# integrate-logging-performance.sh - Intégration avec l'app.ts existant

set -e

echo "🔧 Intégration Logging & Performance avec votre app.ts existant"
echo "=============================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Installer les dépendances manquantes
install_missing_deps() {
    log_info "Installation des dépendances manquantes..."
    
    # Dépendances déjà présentes : winston, winston-daily-rotate-file, compression, helmet, express-rate-limit, response-time
    # On installe seulement ce qui manque
    npm install sharp @types/sharp --save
    npm install --save-dev @types/compression
    
    log_success "Dépendances installées"
}

# 2. Créer les dossiers nécessaires
create_directories() {
    log_info "Création des dossiers nécessaires..."
    
    mkdir -p logs
    mkdir -p uploads/{optimized,thumbnails}
    mkdir -p src/config
    mkdir -p src/services/performance
    mkdir -p src/middleware/performance
    
    log_success "Dossiers créés"
}

# 3. Sauvegarder l'app.ts existant
backup_existing_files() {
    log_info "Sauvegarde des fichiers existants..."
    
    if [ -f "src/app.ts" ]; then
        cp src/app.ts src/app.ts.backup
        log_success "app.ts sauvegardé vers app.ts.backup"
    fi
    
    if [ -f ".env" ]; then
        cp .env .env.backup
        log_success ".env sauvegardé vers .env.backup"
    fi
}

# 4. Créer les nouveaux fichiers de configuration
create_config_files() {
    log_info "Création des fichiers de configuration..."
    
    # Logger configuration (adapté à votre structure)
    cat > src/config/logger.config.ts << 'EOF'
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Configuration Winston adaptée à votre app existante
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console en développement
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : []),
    
    // Fichiers en production
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d'
    }),
    
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Méthodes utilitaires pour votre app
export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Stream pour Morgan (compatible avec votre morganLogger)
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

export default logger;
EOF

    # Cache service simplifié pour votre Redis existant
    cat > src/services/cache.service.ts << 'EOF'
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set failed:', error);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete failed:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  // Méthodes spécialisées pour votre app
  async cacheUserData(userId: string, data: any, ttl: number = 900): Promise<boolean> {
    return this.set(`user:${userId}`, data, ttl);
  }

  async getUserData<T>(userId: string): Promise<T | null> {
    return this.get<T>(`user:${userId}`);
  }

  async cacheVideoStatus(taskId: string, status: any, ttl: number = 300): Promise<boolean> {
    return this.set(`video:${taskId}`, status, ttl);
  }

  async getVideoStatus<T>(taskId: string): Promise<T | null> {
    return this.get<T>(`video:${taskId}`);
  }
}

export const cacheService = new CacheService();
EOF

    # Image optimization service
    cat > src/services/imageOptimization.service.ts << 'EOF'
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export class ImageOptimizationService {
  private uploadDir: string;
  private optimizedDir: string;
  private thumbnailDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_PATH || './uploads';
    this.optimizedDir = path.join(this.uploadDir, 'optimized');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
  }

  async optimizeImage(inputPath: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}): Promise<{
    success: boolean;
    optimizedPath?: string;
    thumbnailPath?: string;
    originalSize: number;
    optimizedSize: number;
    error?: string;
  }> {
    try {
      const stats = await fs.stat(inputPath);
      const originalSize = stats.size;

      const filename = path.basename(inputPath, path.extname(inputPath));
      const optimizedPath = path.join(this.optimizedDir, `${filename}_opt.jpg`);
      const thumbnailPath = path.join(this.thumbnailDir, `${filename}_thumb.jpg`);

      // Optimiser l'image principale
      await sharp(inputPath)
        .resize(options.width || 1920, options.height || 1080, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: options.quality || 85, progressive: true })
        .toFile(optimizedPath);

      // Créer la thumbnail
      await sharp(inputPath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      const optimizedStats = await fs.stat(optimizedPath);
      const optimizedSize = optimizedStats.size;

      return {
        success: true,
        optimizedPath,
        thumbnailPath,
        originalSize,
        optimizedSize
      };

    } catch (error) {
      return {
        success: false,
        originalSize: 0,
        optimizedSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const imageOptimizationService = new ImageOptimizationService();
EOF

    log_success "Fichiers de configuration créés"
}

# 5. Créer le middleware de performance pour votre app
create_performance_middleware() {
    log_info "Création du middleware de performance..."
    
    cat > src/middleware/performance.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import responseTime from 'response-time';
import { logInfo, logWarn, logError } from '../config/logger.config';
import { cacheService } from '../services/cache.service';

// Middleware pour mesurer le temps de réponse (s'intègre avec votre app existante)
export const performanceMiddleware = responseTime((req: Request, res: Response, time: number) => {
  // Logger les requêtes avec temps de réponse
  logInfo('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: time,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Alertes pour les réponses lentes
  if (time > 5000) {
    logWarn('Slow Response Detected', {
      url: req.originalUrl,
      method: req.method,
      responseTime: time
    });
  }
});

// Middleware de cache pour les réponses GET
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `route:${req.originalUrl}`;
    
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logInfo('Cache hit', { url: req.originalUrl });
        return res.json(cached);
      }

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = function(data: any) {
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, duration).catch(error => {
            logError('Cache storage failed', error);
          });
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logError('Cache middleware error', error as Error);
      next();
    }
  };
};

// Middleware d'erreur avec logging
export const errorLoggingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logError('Request Error', error, {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    ip: req.ip
  });

  next(error);
};
EOF

    log_success "Middleware de performance créé"
}

# 6. Créer les routes de monitoring étendues
create_monitoring_routes() {
    log_info "Création des routes de monitoring..."
    
    cat > src/routes/monitoring.routes.ts << 'EOF'
import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { imageOptimizationService } from '../services/imageOptimization.service';

const router = Router();

// Route de santé étendue avec métriques
router.get('/health-extended', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Test Redis
    const redisHealthy = await cacheService.exists('health_test');
    await cacheService.set('health_test', 'ok', 10);
    
    // Métriques système
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Métriques personnalisées pour votre app
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'SaaS Video E-commerce API',
      version: '1.0.0',
      uptime,
      responseTime,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      services: {
        redis: redisHealthy ? 'connected' : 'disconnected',
        database: 'connected', // Votre MongoDB
        fileStorage: 'available'
      },
      features: {
        videoGeneration: !!process.env.RUNWAY_API_KEY,
        aiServices: !!(process.env.OPENAI_API_KEY && process.env.ELEVENLABS_API_KEY),
        imageOptimization: true,
        queueProcessing: !!process.env.REDIS_URL
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Métriques système simples
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
EOF

    log_success "Routes de monitoring créées"
}

# 7. Mettre à jour votre .env avec les nouvelles variables
update_env_file() {
    log_info "Mise à jour du fichier .env..."
    
    # Ajouter les nouvelles variables à la fin du .env existant
    cat >> .env << 'EOF'

# ===== LOGGING & PERFORMANCE =====
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
CACHE_TTL_DEFAULT=300
IMAGE_OPTIMIZATION_QUALITY=85
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080
PERFORMANCE_ALERT_THRESHOLD=5000
EOF

    log_success "Variables d'environnement ajoutées"
}

# 8. Créer un app.ts intégré (sans casser l'existant)
create_integrated_app() {
    log_info "Création de l'app.ts intégré..."
    
    cat > src/app.enhanced.ts << 'EOF'
// app.enhanced.ts - Version avec logging et performance intégrés
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
import videosRoutes from './routes/videos.routes'
import monitoringRoutes from './routes/monitoring.routes'
import rateLimit from 'express-rate-limit'
import fs from 'fs'
import { queueRoutes } from './routes/queue.routes'
import './services/queue.service'

// ===== NOUVEAUX IMPORTS PERFORMANCE =====
import { performanceMiddleware, cacheMiddleware, errorLoggingMiddleware } from './middleware/performance.middleware'
import { logInfo, logError, httpLogStream } from './config/logger.config'
import morgan from 'morgan'

// Création automatique des dossiers
const createDirectories = () => {
  const dirs = [
    'uploads',
    'uploads/optimized', 
    'uploads/thumbnails',
    'logs'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logInfo(`📁 Dossier créé: ${fullPath}`);
    }
  });
};

createDirectories();

const app: Application = express()

// ===== MIDDLEWARES AVEC PERFORMANCE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

app.use(compression({
  threshold: 1024,
  level: 6
}))

app.use(cors(corsOptions))
app.use(rateLimit(rateLimitConfig))

// Performance monitoring
app.use(performanceMiddleware)

// Logging amélioré avec Winston
app.use(morgan('combined', { 
  stream: httpLogStream,
  skip: (req) => req.originalUrl === '/health'
}))

app.use(requestLogger)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(jsonErrorHandler)

// ===== SERVEUR DE FICHIERS STATIQUES AVEC CACHE =====
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Cache plus long pour les images optimisées
    if (path.includes('optimized') || path.includes('thumbnails')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 an
    }
  }
}))

// ===== ROUTES DE SANTÉ AVEC CACHE =====
app.get('/health', cacheMiddleware(30), (req: Request, res: Response) => {
  res.redirect('/api/health')
})

app.get('/api/health', cacheMiddleware(30), (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SaaS Video E-commerce API',
    uptime: process.uptime(),
    version: '1.0.0-enhanced'
  });
});

// ===== ROUTES PRINCIPALES =====
app.use('/api/upload', uploadRoutes)
app.use('/api/credits', creditsRoutes)
app.use('/api/runway', runwayRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/videos', videosRoutes)
app.use('/api/monitoring', monitoringRoutes) // ✅ Nouvelles routes monitoring
app.use('/api', routes)

// ===== ROUTES EXISTANTES ÉTENDUES =====
// Toutes vos routes health existantes sont conservées
app.get('/api/health-extended', async (req: Request, res: Response) => {
  try {
    // Votre logique existante + nouvelles métriques
    const { cleanupService } = await import('./services/cleanup.service')
    const { runwayPollingService } = await import('./services/runway.polling.service')
    
    // Nouvelles métriques de performance
    const memoryUsage = process.memoryUsage();
    const startTime = Date.now();
    
    // Test cache
    const { cacheService } = await import('./services/cache.service');
    await cacheService.set('health_test', 'ok', 10);
    const cacheWorking = await cacheService.exists('health_test');
    
    const responseTime = Date.now() - startTime;
    
    // Votre logique existante conservée...
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
      const { elevenlabsService } = await import('./services/elevenlabs.service');
      elevenlabsHealth = await elevenlabsService.getServiceHealth();
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
    
    const allServicesHealthy = 
      queueHealth?.healthy !== false &&
      openaiHealth?.status !== 'error' &&
      elevenlabsHealth?.status !== 'error' &&
      assemblyHealth?.status !== 'error' &&
      runwayApiStatus !== 'error' &&
      cacheWorking;
    
    res.json({
      status: allServicesHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      
      // Nouvelles métriques de performance
      performance: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        uptime: process.uptime(),
        cache: cacheWorking ? 'healthy' : 'error'
      },
      
      // Vos services existants conservés
      services: {
        api: 'running',
        database: 'connected',
        cleanup: cleanupStatus.running ? 'running' : 'stopped',
        runwayApi: runwayApiStatus,
        runwayPolling: runwayPollingStatus.running ? 'running' : 'stopped',
        queue: queueHealth?.healthy ? 'running' : 'error',
        openai: openaiHealth?.status || 'unknown',
        elevenlabs: elevenlabsHealth?.status || 'unknown',
        ffmpeg: assemblyHealth?.status || 'unknown',
        cache: cacheWorking ? 'running' : 'error' // ✅ Nouveau
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
        },
        // ✅ Nouvelles métriques
        performance: {
          cacheService: cacheWorking,
          loggingEnabled: true,
          compressionEnabled: true,
          imageOptimizationEnabled: true
        }
      }
    })
  } catch (error: any) {
    logError('Health check extended failed', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
})

// Toutes vos autres routes existantes sont conservées...
app.get('/api/debug/env', (req, res) => {
  res.json({
    runway_key_defined: !!process.env.RUNWAY_API_KEY,
    runway_key_length: process.env.RUNWAY_API_KEY?.length || 0,
    runway_url: process.env.RUNWAY_API_URL,
    openai_key_defined: !!process.env.OPENAI_API_KEY,
    openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
    elevenlabs_key_defined: !!process.env.ELEVENLABS_API_KEY,
    elevenlabs_key_length: process.env.ELEVENLABS_API_KEY?.length || 0,
    ffmpeg_path: process.env.FFMPEG_PATH || 'ffmpeg',
    redis_configured: !!process.env.REDIS_URL,
    node_env: process.env.NODE_ENV,
    // ✅ Nouvelles variables
    logging_enabled: process.env.LOG_LEVEL || 'info',
    performance_monitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
  });
});

// Conservez toutes vos autres routes existantes...
app.get('/api/runway/health', async (req: Request, res: Response) => {
  // Votre implémentation existante exactement
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

app.get('/api/pipeline/health', async (req: Request, res: Response) => {
  // Votre implémentation existante exactement conservée
  try {
    let services: any = {};