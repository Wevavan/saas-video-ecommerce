// src/config/logger.config.ts - VERSION CORRIGÉE SANS CONFLITS
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Interface pour les métadonnées de log
interface LogMetadata {
  userId?: string;
  requestId?: string;
  action?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

// Configuration des formats
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Création des transports
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console en développement
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: consoleFormat,
      })
    );
  }

  // Console en production (format JSON)
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.Console({
        level: 'info',
        format: fileFormat,
      })
    );
  }

  // Fichiers avec rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
    })
  );

  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
    })
  );

  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: fileFormat,
      maxSize: '50m',
      maxFiles: '7d',
    })
  );

  return transports;
};

// Logger principal Winston
const appLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports: createTransports(),
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// Classe Logger avec méthodes utilitaires
export class AppLogger {
  private winston: winston.Logger;

  constructor() {
    this.winston = appLogger;
  }

  error(message: string, meta?: LogMetadata): void {
    this.winston.error(message, this.formatMetadata(meta));
  }

  warn(message: string, meta?: LogMetadata): void {
    this.winston.warn(message, this.formatMetadata(meta));
  }

  info(message: string, meta?: LogMetadata): void {
    this.winston.info(message, this.formatMetadata(meta));
  }

  http(message: string, meta?: LogMetadata): void {
    this.winston.http(message, this.formatMetadata(meta));
  }

  debug(message: string, meta?: LogMetadata): void {
    this.winston.debug(message, this.formatMetadata(meta));
  }

  // Méthodes spécialisées
  logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string): void {
    this.http('HTTP Request', {
      action: 'http_request',
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  }

  logError(error: Error, context?: string, userId?: string): void {
    this.error(`${context || 'Error'}: ${error.message}`, {
      error,
      userId,
      stack: error.stack,
      context,
    });
  }

  logUserAction(action: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      userId,
      action,
      ...metadata,
    });
  }

  logVideoGeneration(taskId: string, userId: string, status: string, duration?: number): void {
    this.info(`Video Generation: ${status}`, {
      userId,
      action: 'video_generation',
      taskId,
      status,
      duration,
    });
  }

  logCreditTransaction(userId: string, amount: number, type: string, newBalance: number): void {
    this.info('Credit Transaction', {
      userId,
      action: 'credit_transaction',
      amount,
      type,
      newBalance,
    });
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const level = duration > 1000 ? 'warn' : 'info';
    this.winston[level](`Performance: ${operation}`, {
      action: 'performance',
      duration,
      ...metadata,
    });
  }

  private formatMetadata(meta?: LogMetadata): Record<string, any> {
    if (!meta) return {};

    const formatted: Record<string, any> = {};

    if (meta.userId) formatted.userId = meta.userId;
    if (meta.requestId) formatted.requestId = meta.requestId;
    if (meta.action) formatted.action = meta.action;
    if (meta.duration !== undefined) formatted.duration = meta.duration;
    if (meta.error) {
      formatted.error = {
        message: meta.error.message,
        stack: meta.error.stack,
        name: meta.error.name,
      };
    }

    // Ajouter les autres propriétés
    Object.keys(meta).forEach(key => {
      if (!['userId', 'requestId', 'action', 'duration', 'error'].includes(key)) {
        formatted[key] = meta[key];
      }
    });

    return formatted;
  }

  getHttpLogStream(): { write: (message: string) => void } {
    return {
      write: (message: string) => {
        this.http(message.trim());
      },
    };
  }
}

// Instance unique du logger
const loggerInstance = new AppLogger();

// Exports pour compatibilité avec votre code existant
export { appLogger };
export const logger = loggerInstance;

// Fonctions utilitaires simples
export const logError = (message: string, error?: Error, meta?: any) => {
  loggerInstance.error(message, { error, ...meta });
};

export const logInfo = (message: string, meta?: any) => {
  loggerInstance.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  loggerInstance.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  loggerInstance.debug(message, meta);
};

// Stream pour Morgan
export const httpLogStream = {
  write: (message: string) => {
    loggerInstance.http(message.trim());
  }
};

// Middleware pour ajouter requestId
export const addRequestId = (req: any, res: any, next: any) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  next();
};