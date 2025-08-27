// backend/src/config/redis.config.ts - VERSION ULTRA SIMPLIFIÉE QUI MARCHE
import Redis from 'ioredis';

export const createRedisConnection = () => {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL non définie dans .env');
  }

  console.log('🔗 Connexion Redis Upstash...');

  // Instanciation du client Redis
  const redis = new Redis(process.env.REDIS_URL);

  // ✅ Event listeners essentiels seulement
  redis.on('connect', () => {
    console.log('✅ Redis connecté à Upstash');
  });
  
  redis.on('ready', () => {
    console.log('🚀 Redis prêt');
  });
  
  redis.on('error', (err) => {
    // Filtrer les erreurs non critiques
    if (err.message.includes('Connection is closed') || 
        err.message.includes('ECONNRESET')) {
      console.warn('⚠️ Redis connexion interrompue (normal)');
    } else {
      console.error('❌ Redis error:', err.message);
    }
  });

  redis.on('close', () => {
    console.warn('📡 Redis connexion fermée');
  });

  return redis;
};

// ✅ Test de connexion séparé (optionnel)
export const testRedisConnection = async () => {
  try {
    const testRedis = createRedisConnection();
    
    console.log('🧪 Test connexion Redis...');
    await Promise.race([
      testRedis.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);
    
    console.log('✅ Test Redis réussi');
    await testRedis.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Test Redis échoué:', (error as Error).message);
    return false;
  }
};

// Export de l'instance
// ✅ Export avec gestion d'erreur
let redisConnection: Redis | null = null;

try {
  redisConnection = createRedisConnection();
  console.log('✅ Instance Redis créée');
} catch (error) {
  console.error('❌ Impossible de créer la connexion Redis:', (error as Error).message);
  redisConnection = null;
}

export { redisConnection };
export default redisConnection;