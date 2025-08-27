// src/services/cache.service.ts - VERSION CORRIGÉE AVEC URL COMPLÈTE
import Redis from 'ioredis';
import { logError, logDebug } from '../config/logger.config';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  compress?: boolean;
}

export class CacheService {
  private static instance: CacheService;
  private redis: Redis | null = null;
  private defaultTTL = 300; // 5 minutes
  private isConnected = false;

  private constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      if (!process.env.REDIS_URL) {
        console.warn('⚠️ REDIS_URL non définie - Cache service désactivé');
        return;
      }

      console.log('🔗 Cache service - Connexion Redis Upstash...');
      
      // ✅ UTILISATION DE L'URL COMPLÈTE (SOLUTION PRINCIPALE)
      this.redis = new Redis(process.env.REDIS_URL, {
        connectTimeout: 5000,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 2) {
            console.log('❌ Cache Redis définitivement inaccessible');
            return null;
          }
          return Math.min(times * 500, 1500);
        }
      });

      // ✅ Gestion d'erreurs avec filtrage des erreurs locales
      this.redis.on('connect', () => {
        console.log('✅ Cache Redis connecté');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        // ✅ FILTRER LES ERREURS REDIS LOCALES
        if (error.message.includes('127.0.0.1:6379') || 
            error.message.includes('ECONNREFUSED')) {
          console.log('⚠️ Cache: Tentative Redis locale ignorée');
          return;
        }
        
        logError('Redis connection error', error);
        this.isConnected = false;
      });

      this.redis.on('ready', () => {
        logDebug('Redis connected successfully');
        console.log('✅ Cache Redis prêt');
        this.isConnected = true;
      });

      this.redis.on('close', () => {
        console.log('🔌 Cache Redis fermé');
        this.isConnected = false;
      });

      // Test de connexion avec timeout
      try {
        await Promise.race([
          this.redis.ping(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cache ping timeout')), 3000)
          )
        ]);
        console.log('✅ Cache Redis ping OK');
        this.isConnected = true;
      } catch (error) {
        console.warn('⚠️ Cache ping échoué, mais service disponible');
      }

    } catch (error) {
      console.warn('❌ Cache service sans Redis:', (error as Error).message);
      this.redis = null;
      this.isConnected = false;
    }
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // ✅ Méthodes avec fallback gracieux
  async set(key: string, data: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      logDebug('Cache set skipped - Redis unavailable', { key });
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const serializedData = this.serialize(data, options.compress);
      const ttl = options.ttl || this.defaultTTL;

      await this.redis.setex(fullKey, ttl, serializedData);
      
      logDebug('Cache set', { key: fullKey, ttl, compressed: options.compress });
      return true;
    } catch (error) {
      logError('Cache set failed', error as Error, { key, options });
      return false;
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      logDebug('Cache get skipped - Redis unavailable', { key });
      return null;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const data = await this.redis.get(fullKey);

      if (!data) {
        logDebug('Cache miss', { key: fullKey });
        return null;
      }

      const deserializedData = this.deserialize<T>(data, options.compress);
      logDebug('Cache hit', { key: fullKey });
      return deserializedData;
    } catch (error) {
      logError('Cache get failed', error as Error, { key, options });
      return null;
    }
  }

  async del(key: string, prefix?: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.del(fullKey);
      
      logDebug('Cache delete', { key: fullKey, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logError('Cache delete failed', error as Error, { key });
      return false;
    }
  }

  async delPattern(pattern: string, prefix?: string): Promise<number> {
    if (!this.redis || !this.isConnected) {
      return 0;
    }

    try {
      const fullPattern = this.buildKey(pattern, prefix);
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      logDebug('Cache pattern delete', { pattern: fullPattern, keysDeleted: result });
      return result;
    } catch (error) {
      logError('Cache pattern delete failed', error as Error, { pattern });
      return 0;
    }
  }

  async exists(key: string, prefix?: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      logError('Cache exists check failed', error as Error, { key });
      return false;
    }
  }

  // Méthodes spécialisées (identiques à votre code original)
  async cacheUserData(userId: string, data: any, ttl: number = 900): Promise<boolean> {
    return this.set(`user:${userId}`, data, { ttl, prefix: 'user_data' });
  }

  async getUserData<T>(userId: string): Promise<T | null> {
    return this.get<T>(`user:${userId}`, { prefix: 'user_data' });
  }

  async invalidateUserData(userId: string): Promise<void> {
    await this.delPattern(`user:${userId}*`, 'user_data');
  }

  async cacheVideoStatus(taskId: string, status: any, ttl: number = 300): Promise<boolean> {
    return this.set(`task:${taskId}`, status, { ttl, prefix: 'video_status' });
  }

  async getVideoStatus<T>(taskId: string): Promise<T | null> {
    return this.get<T>(`task:${taskId}`, { prefix: 'video_status' });
  }

  async cacheUserImages(userId: string, images: any[], ttl: number = 600): Promise<boolean> {
    return this.set(`images:${userId}`, images, { ttl, prefix: 'user_images', compress: true });
  }

  async getUserImages<T>(userId: string): Promise<T | null> {
    return this.get<T>(`images:${userId}`, { prefix: 'user_images', compress: true });
  }

  async cacheUserCredits(userId: string, credits: number, ttl: number = 60): Promise<boolean> {
    return this.set(`credits:${userId}`, credits, { ttl, prefix: 'user_credits' });
  }

  async getUserCredits(userId: string): Promise<number | null> {
    return this.get<number>(`credits:${userId}`, { prefix: 'user_credits' });
  }

  async cacheSystemStats(stats: any, ttl: number = 30): Promise<boolean> {
    return this.set('system_stats', stats, { ttl, prefix: 'monitoring' });
  }

  async getSystemStats<T>(): Promise<T | null> {
    return this.get<T>('system_stats', { prefix: 'monitoring' });
  }

  async cacheAPIResponse(service: string, endpoint: string, response: any, ttl: number = 180): Promise<boolean> {
    const key = `${service}:${endpoint}`;
    return this.set(key, response, { ttl, prefix: 'api_cache', compress: true });
  }

  async getAPIResponse<T>(service: string, endpoint: string): Promise<T | null> {
    const key = `${service}:${endpoint}`;
    return this.get<T>(key, { prefix: 'api_cache', compress: true });
  }

  // Méthodes utilitaires (identiques)
  private buildKey(key: string, prefix?: string): string {
    const parts = ['saas_video'];
    if (prefix) parts.push(prefix);
    parts.push(key);
    return parts.join(':');
  }

  private serialize(data: any, compress: boolean = false): string {
    const json = JSON.stringify(data);
    
    if (compress && json.length > 1000) {
      return `compressed:${json}`;
    }
    
    return json;
  }

  private deserialize<T>(data: string, compress: boolean = false): T {
    if (compress && data.startsWith('compressed:')) {
      return JSON.parse(data.substring(11));
    }
    
    return JSON.parse(data);
  }

  // Monitoring du cache
  async getCacheInfo(): Promise<any> {
    if (!this.redis || !this.isConnected) {
      return {
        connected: false,
        status: 'unavailable'
      };
    }

    try {
      const info = await this.redis.info('memory');
      const stats = await this.redis.info('stats');
      
      return {
        memory: this.parseRedisInfo(info),
        stats: this.parseRedisInfo(stats),
        connected: await this.redis.ping() === 'PONG',
      };
    } catch (error) {
      logError('Failed to get cache info', error as Error);
      return {
        connected: false,
        error: (error as Error).message
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const result: Record<string, any> = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    });
    
    return result;
  }

  async cleanup(): Promise<void> {
    if (!this.redis || !this.isConnected) {
      console.log('⚠️ Cache cleanup skipped - Redis unavailable');
      return;
    }

    try {
      const patterns = [
        'saas_video:temp:*',
        'saas_video:session:*',
        'saas_video:rate_limit:*',
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          logDebug(`Cache cleanup: removed ${keys.length} keys for pattern ${pattern}`);
        }
      }
    } catch (error) {
      logError('Cache cleanup failed', error as Error);
    }
  }

  async warmup(): Promise<void> {
    try {
      logDebug('Starting cache warmup...');
      // Pré-charger des données importantes si nécessaire
      logDebug('Cache warmup completed');
    } catch (error) {
      logError('Cache warmup failed', error as Error);
    }
  }

  // ✅ Getter pour vérifier l'état
  get isRedisConnected(): boolean {
    return this.isConnected && this.redis !== null;
  }
}

export const cacheService = CacheService.getInstance();