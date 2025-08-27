// src/services/apiService.service.ts - VERSION SIMPLIFIÉE SANS ERREURS
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logError, logInfo, logWarn } from '../config/logger.config';
import { cacheService } from './cache.service';

// Interface pour la configuration des timeouts
interface ServiceConfig {
  connect: number;
  response: number;
  retry: number;
  retryDelay: number;
}

// Configuration par service
const API_CONFIGS: Record<string, ServiceConfig> = {
  runway: {
    connect: 10000,
    response: 60000,
    retry: 3,
    retryDelay: 2000,
  },
  elevenlabs: {
    connect: 5000,
    response: 30000,
    retry: 3,
    retryDelay: 1500,
  },
  openai: {
    connect: 5000,
    response: 45000,
    retry: 2,
    retryDelay: 1000,
  },
  stripe: {
    connect: 5000,
    response: 15000,
    retry: 2,
    retryDelay: 500,
  },
  default: {
    connect: 5000,
    response: 15000,
    retry: 2,
    retryDelay: 1000,
  },
};

// Interface pour les métriques API simplifiées
interface APIMetric {
  service: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  timestamp: Date;
  errorMessage?: string;
}

export class APIService {
  private static instance: APIService;
  private clients: Map<string, AxiosInstance> = new Map();
  private metrics: APIMetric[] = [];

  private constructor() {
    this.initializeClients();
  }

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private initializeClients(): void {
    Object.keys(API_CONFIGS).forEach(service => {
      if (service === 'default') return;
      
      const config = API_CONFIGS[service];
      const client = this.createAxiosClient(service, config);
      this.clients.set(service, client);
    });

    logInfo('API service initialized', {
      services: Array.from(this.clients.keys())
    });
  }

  private createAxiosClient(service: string, config: ServiceConfig): AxiosInstance {
    const client = axios.create({
      timeout: config.response,
      headers: {
        'User-Agent': 'SaasVideoEcommerce/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur de requête
    client.interceptors.request.use(
      (requestConfig) => {
        // Ajouter timestamp pour mesurer le temps de réponse
        (requestConfig as any).startTime = Date.now();
        
        logInfo(`API Request: ${service}`, {
          url: requestConfig.url,
          method: requestConfig.method?.toUpperCase(),
        });
        return requestConfig;
      },
      (error) => {
        logError(`API Request Error: ${service}`, error);
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse
    client.interceptors.response.use(
      (response) => {
        this.recordMetric(service, response, true);
        return response;
      },
      (error) => {
        this.recordMetric(service, error.response, false, error.message);
        return Promise.reject(error);
      }
    );

    return client;
  }

  private recordMetric(
    service: string,
    response: AxiosResponse | undefined,
    success: boolean,
    errorMessage?: string
  ): void {
    const startTime = (response?.config as any)?.startTime || Date.now();
    const responseTime = Date.now() - startTime;

    const metric: APIMetric = {
      service,
      endpoint: response?.config?.url || 'unknown',
      method: response?.config?.method?.toUpperCase() || 'UNKNOWN',
      responseTime,
      statusCode: response?.status || 0,
      success,
      timestamp: new Date(),
      errorMessage,
    };

    this.metrics.push(metric);

    // Garder seulement les 500 dernières métriques
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-500);
    }

    // Logger les problèmes de performance
    if (!success || responseTime > 10000) {
      logWarn(`API Performance Issue: ${service}`, {
        responseTime,
        success,
        endpoint: metric.endpoint,
        errorMessage,
      });
    }
  }

  // Effectuer une requête avec retry automatique
  async makeRequest<T = any>(
    service: string,
    config: AxiosRequestConfig,
    cacheKey?: string,
    cacheTTL: number = 300
  ): Promise<T> {
    const serviceConfig = API_CONFIGS[service] || API_CONFIGS.default;
    const client = this.clients.get(service) || axios;

    // Vérifier le cache d'abord
    if (cacheKey) {
      const cached = await cacheService.getAPIResponse<T>(service, cacheKey);
      if (cached) {
        logInfo(`API Cache Hit: ${service}`, { cacheKey });
        return cached;
      }
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= serviceConfig.retry; attempt++) {
      try {
        logInfo(`API Request Attempt ${attempt + 1}: ${service}`, {
          attempt: attempt + 1,
          maxAttempts: serviceConfig.retry + 1,
        });

        const response = await client.request<T>({
          ...config,
          timeout: serviceConfig.response,
        });

        const responseTime = Date.now() - startTime;
        
        logInfo(`API Request Success: ${service}`, {
          responseTime,
          statusCode: response.status,
          retryCount: attempt,
        });

        // Mettre en cache si demandé
        if (cacheKey && response.status === 200) {
          await cacheService.cacheAPIResponse(service, cacheKey, response.data, cacheTTL);
        }

        return response.data;

      } catch (error) {
        lastError = error as Error;
        
        const responseTime = Date.now() - startTime;
        
        logWarn(`API Request Failed: ${service} (Attempt ${attempt + 1})`, {
          attempt: attempt + 1,
          responseTime,
          errorMessage: lastError.message,
        });

        // Ne pas retry sur certaines erreurs
        if (this.shouldNotRetry(error as any)) {
          logInfo(`API Request Not Retryable: ${service}`, {
            errorMessage: lastError.message,
          });
          break;
        }

        // Attendre avant la prochaine tentative
        if (attempt < serviceConfig.retry) {
          const delay = serviceConfig.retryDelay * Math.pow(2, attempt);
          logInfo(`API Request Retry Delay: ${service}`, {
            delay,
            nextAttempt: attempt + 2,
          });
          await this.delay(delay);
        }
      }
    }

    // Toutes les tentatives ont échoué
    const totalTime = Date.now() - startTime;
    logError(`API Request Final Failure: ${service}`, lastError || new Error('Unknown error'), {
      totalTime,
      retryCount: serviceConfig.retry,
    });

    throw lastError || new Error(`API request failed after ${serviceConfig.retry + 1} attempts`);
  }

  private shouldNotRetry(error: any): boolean {
    const nonRetryableStatuses = [400, 401, 403, 404, 422, 429];
    
    if (error.response?.status && nonRetryableStatuses.includes(error.response.status)) {
      return true;
    }

    if (error.message?.includes('validation') || 
        error.message?.includes('authentication') ||
        error.message?.includes('authorization')) {
      return true;
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Méthodes spécialisées pour chaque service

  // Runway API
  async callRunwayAPI<T = any>(endpoint: string, data?: any, method: 'GET' | 'POST' = 'POST'): Promise<T> {
    const config: AxiosRequestConfig = {
      url: `${process.env.RUNWAY_API_URL || 'https://api.dev.runwayml.com/v1'}${endpoint}`,
      method,
      data,
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    return this.makeRequest<T>('runway', config, `runway:${endpoint}`, 60);
  }

  // ElevenLabs API
  async callElevenLabsAPI<T = any>(endpoint: string, data?: any, method: 'GET' | 'POST' = 'POST'): Promise<T> {
    const config: AxiosRequestConfig = {
      url: `https://api.elevenlabs.io/v1${endpoint}`,
      method,
      data,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    return this.makeRequest<T>('elevenlabs', config, `elevenlabs:${endpoint}`, 180);
  }

  // OpenAI API
  async callOpenAIAPI<T = any>(endpoint: string, data?: any, method: 'GET' | 'POST' = 'POST'): Promise<T> {
    const config: AxiosRequestConfig = {
      url: `https://api.openai.com/v1${endpoint}`,
      method,
      data,
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    return this.makeRequest<T>('openai', config, `openai:${endpoint}`, 300);
  }

  // Stripe API
  async callStripeAPI<T = any>(endpoint: string, data?: any, method: 'GET' | 'POST' = 'POST'): Promise<T> {
    const config: AxiosRequestConfig = {
      url: `https://api.stripe.com/v1${endpoint}`,
      method,
      data,
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    return this.makeRequest<T>('stripe', config);
  }

  // Obtenir les métriques API
  getAPIMetrics(service?: string, hours: number = 24): APIMetric[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.metrics
      .filter(m => m.timestamp >= cutoff)
      .filter(m => !service || m.service === service)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Calculer les statistiques de santé API
  getAPIHealthStats(service?: string): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    slowRequests: number;
    errorsByType: Record<string, number>;
  } {
    const metrics = this.getAPIMetrics(service, 1); // Dernière heure
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        averageResponseTime: 0,
        slowRequests: 0,
        errorsByType: {},
      };
    }

    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.success).length;
    const successRate = (successfulRequests / totalRequests) * 100;
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const slowRequests = metrics.filter(m => m.responseTime > 5000).length;

    // Grouper les erreurs par type
    const errorsByType: Record<string, number> = {};
    metrics.filter(m => !m.success).forEach(m => {
      const errorType = m.errorMessage || 'Unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      errorsByType,
    };
  }

  // Test de connectivité pour tous les services
  async testAllServices(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    const tests = [
      {
        service: 'runway',
        test: async () => {
          if (!process.env.RUNWAY_API_KEY) return false;
          try {
            await this.callRunwayAPI('/tasks', null, 'GET');
            return true;
          } catch (error) {
            return false;
          }
        }
      },
      {
        service: 'elevenlabs',
        test: async () => {
          if (!process.env.ELEVENLABS_API_KEY) return false;
          try {
            await this.callElevenLabsAPI('/voices', null, 'GET');
            return true;
          } catch (error) {
            return false;
          }
        }
      },
      {
        service: 'openai',
        test: async () => {
          if (!process.env.OPENAI_API_KEY) return false;
          try {
            await this.callOpenAIAPI('/models', null, 'GET');
            return true;
          } catch (error) {
            return false;
          }
        }
      }
    ];

    for (const { service, test } of tests) {
      try {
        results[service] = await test();
        logInfo(`Service ${service} health check: ${results[service] ? 'healthy' : 'unhealthy'}`);
      } catch (error) {
        results[service] = false;
        logWarn(`Service ${service} health check failed`, { 
          errorMessage: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  // Nettoyer les anciennes métriques
  cleanupOldMetrics(hours: number = 24): void {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const originalLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    
    const removedCount = originalLength - this.metrics.length;
    if (removedCount > 0) {
      logInfo(`Cleaned up ${removedCount} old API metrics`);
    }
  }

  // Obtenir le statut global des APIs
  async getGlobalAPIStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      configured: boolean;
      healthy: boolean;
      responseTime?: number;
      lastCheck: Date;
    }>;
  }> {
    const services: Record<string, any> = {};
    const serviceNames = ['runway', 'elevenlabs', 'openai', 'stripe'];
    
    for (const serviceName of serviceNames) {
      const configured = this.isServiceConfigured(serviceName);
      let healthy = false;
      let responseTime: number | undefined;
      
      if (configured) {
        try {
          const startTime = Date.now();
          const healthCheck = await this.testServiceHealth(serviceName);
          responseTime = Date.now() - startTime;
          healthy = healthCheck;
        } catch (error) {
          healthy = false;
        }
      }
      
      services[serviceName] = {
        configured,
        healthy,
        responseTime,
        lastCheck: new Date(),
      };
    }
    
    // Déterminer le statut global
    const configuredServices = Object.values(services).filter(s => s.configured);
    const healthyServices = configuredServices.filter(s => s.healthy);
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices.length === configuredServices.length) {
      overall = 'healthy';
    } else if (healthyServices.length > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }
    
    return { overall, services };
  }

  private isServiceConfigured(service: string): boolean {
    switch (service) {
      case 'runway':
        return !!(process.env.RUNWAY_API_KEY && process.env.RUNWAY_API_URL);
      case 'elevenlabs':
        return !!process.env.ELEVENLABS_API_KEY;
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'stripe':
        return !!process.env.STRIPE_SECRET_KEY;
      default:
        return false;
    }
  }

  private async testServiceHealth(service: string): Promise<boolean> {
    try {
      switch (service) {
        case 'runway':
          await this.callRunwayAPI('/tasks', null, 'GET');
          return true;
        case 'elevenlabs':
          await this.callElevenLabsAPI('/voices', null, 'GET');
          return true;
        case 'openai':
          await this.callOpenAIAPI('/models', null, 'GET');
          return true;
        case 'stripe':
          // Stripe n'a pas d'endpoint de health check simple
          return true;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}

// Export de l'instance singleton
export const apiService = APIService.getInstance();