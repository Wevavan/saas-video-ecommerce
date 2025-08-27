// src/middleware/performance.middleware.ts - VERSION CORRIGÉE
import { Request, Response, NextFunction } from 'express';
import responseTime from 'response-time';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logger } from '../config/logger.config';
import { cacheService } from '../services/cache.service';

// Interface pour les métriques de performance
interface PerformanceMetrics {
  route: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
}

// Buffer pour les métriques
const metricsBuffer: PerformanceMetrics[] = [];
const METRICS_BUFFER_SIZE = 100;

// Middleware de mesure du temps de réponse
export const responseTimeMiddleware = responseTime((req: Request, res: Response, time: number) => {
  const metrics: PerformanceMetrics = {
    route: req.route?.path || req.path,
    method: req.method,
    statusCode: res.statusCode,
    responseTime: time,
    timestamp: new Date(),
    userId: (req as any).user?.id,
  };

  // Logger HTTP avec détails
  logger.logRequest(req.method, req.originalUrl, res.statusCode, time, (req as any).user?.id);

  // Alertes pour les réponses lentes
  if (time > 5000) {
    logger.logPerformance('Slow Response Detected', time, {
      url: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.id,
    });
  }

  // Stocker les métriques
  storeMetrics(metrics);
});

// Fonction pour stocker les métriques
const storeMetrics = async (metrics: PerformanceMetrics) => {
  metricsBuffer.push(metrics);

  if (metricsBuffer.length >= METRICS_BUFFER_SIZE) {
    try {
      const metricsToStore = [...metricsBuffer];
      metricsBuffer.length = 0;

      const key = `metrics:${new Date().toISOString().split('T')[0]}`;
      await cacheService.set(key, metricsToStore, { ttl: 24 * 60 * 60 });
    } catch (error) {
      logger.logError(error as Error, 'Failed to store metrics');
    }
  }
};

// Configuration Helmet pour la sécurité
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Configuration de compression
export const compressionMiddleware = compression({
  threshold: 1024,
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// Rate limiting global
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.logPerformance('Rate limit reached', 0, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Rate limiting pour l'authentification
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    logger.logPerformance('Auth rate limit reached', 0, {
      ip: req.ip,
      url: req.originalUrl,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

// Rate limiting pour la génération de vidéos
export const videoGenerationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50,
  message: {
    success: false,
    error: 'Video generation limit reached, please try again later.',
  },
  handler: (req: Request, res: Response) => {
    logger.logPerformance('Video generation rate limit reached', 0, {
      ip: req.ip,
      userId: (req as any).user?.id,
    });
    
    res.status(429).json({
      success: false,
      error: 'Video generation limit reached, please try again later.',
    });
  },
});

// Slow down middleware
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: 500,
  maxDelayMs: 20000,
});

// Middleware de cache pour les réponses fréquentes
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `cache:${req.method}:${req.originalUrl}:${(req as any).user?.id || 'anonymous'}`;

    try {
      const cachedResponse = await cacheService.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug('Cache hit', { cacheKey, url: req.originalUrl });
        return res.json(cachedResponse);
      }

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = function (data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, { ttl: duration }).catch((error: Error) => {
            logger.logError(error, 'Cache storage failed');
          });

          logger.debug('Cache miss - stored', { cacheKey, url: req.originalUrl });
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.logError(error as Error, 'Cache middleware error');
      next();
    }
  };
};

// Middleware pour invalider le cache d'un utilisateur
export const invalidateUserCache = (userId: string) => {
  return async () => {
    try {
      const pattern = `cache:*:*:${userId}`;
      await cacheService.delPattern(pattern);
      logger.debug('User cache invalidated', { userId });
    } catch (error) {
      logger.logError(error as Error, 'Cache invalidation failed');
    }
  };
};

// Middleware de monitoring des erreurs
export const errorMonitoringMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.logError(error, `${req.method} ${req.originalUrl}`, (req as any).user?.id);

  // Alertes critiques pour certains types d'erreurs
  if (error.name === 'MongoError' || error.message.includes('database')) {
    logger.logPerformance('Database Error Alert', 0, {
      url: req.originalUrl,
      method: req.method,
      error: error.message,
    });
  }

  next(error);
};

// Fonction pour obtenir les métriques de performance
export const getPerformanceMetrics = async (hours: number = 24): Promise<PerformanceMetrics[]> => {
  try {
    const metrics: PerformanceMetrics[] = [];
    const now = new Date();
    
    for (let i = 0; i < hours; i++) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = `metrics:${date.toISOString().split('T')[0]}`;
      
      const data = await cacheService.get<PerformanceMetrics[]>(key);
      if (data) {
        metrics.push(...data);
      }
    }

    return metrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    logger.logError(error as Error, 'Failed to retrieve performance metrics');
    return [];
  }
};

// Fonction pour calculer les statistiques de performance
export const calculatePerformanceStats = (metrics: PerformanceMetrics[]) => {
  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorRate: 0,
      routeStats: {},
    };
  }

  const totalRequests = metrics.length;
  const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
  const slowRequests = metrics.filter(m => m.responseTime > 1000).length;
  const errorRequests = metrics.filter(m => m.statusCode >= 400).length;
  const errorRate = (errorRequests / totalRequests) * 100;

  // Statistiques par route
  const routeStats: Record<string, any> = {};
  metrics.forEach(metric => {
    const key = `${metric.method} ${metric.route}`;
    if (!routeStats[key]) {
      routeStats[key] = {
        count: 0,
        totalTime: 0,
        errors: 0,
      };
    }
    routeStats[key].count++;
    routeStats[key].totalTime += metric.responseTime;
    if (metric.statusCode >= 400) {
      routeStats[key].errors++;
    }
  });

  // Calculer les moyennes par route
  Object.keys(routeStats).forEach(key => {
    const stats = routeStats[key];
    stats.averageTime = stats.totalTime / stats.count;
    stats.errorRate = (stats.errors / stats.count) * 100;
  });

  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    slowRequests,
    errorRate: Math.round(errorRate * 100) / 100,
    routeStats,
  };
};