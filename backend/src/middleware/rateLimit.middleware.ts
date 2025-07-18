import { Options } from 'express-rate-limit'

export const rateLimitConfig: Partial<Options> = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Trop de requêtes de cette adresse IP, réessayez plus tard.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ignorer le rate limiting pour les routes de santé
    return req.path === '/health'
  }
}

// Rate limiting spécifique pour l'authentification
export const authRateLimitConfig: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: {
    error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.',
    retryAfter: 15
  }
}