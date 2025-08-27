// backend/test-redis-upstash.js - Test spécifique Upstash
require('dotenv').config();
const Redis = require('ioredis');

async function debugUpstashConnection() {
  console.log('🧪 Test de connexion Upstash détaillé...\n');
  
  let redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error('❌ REDIS_URL non définie dans .env');
    return;
  }

  console.log('📋 URL originale:', redisUrl.substring(0, 50) + '...');

  // Nettoyer l'URL
  if (redisUrl.includes('redis-cli')) {
    const urlMatch = redisUrl.match(/redis(?:s)?:\/\/[^\s]+/);
    if (urlMatch) {
      redisUrl = urlMatch[0];
      console.log('🔧 URL nettoyée:', redisUrl.substring(0, 50) + '...');
    }
  }

  // Parser l'URL pour debug
  try {
    const url = new URL(redisUrl);
    console.log('📊 Analyse URL:');
    console.log('  - Protocol:', url.protocol);
    console.log('  - Host:', url.hostname);
    console.log('  - Port:', url.port);
    console.log('  - Username:', url.username);
    console.log('  - Password:', url.password ? '***masqué***' : 'aucun');
    console.log('');
  } catch (e) {
    console.error('❌ URL invalide:', e.message);
    return;
  }

  // Test de connexion
  const redis = new Redis(redisUrl, {
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 2,
    tls: {
      rejectUnauthorized: false,
    },
    retryStrategy: (times) => {
      console.log(`⏳ Tentative ${times}/3`);
      if (times > 3) return null;
      return times * 1000;
    }
  });

  redis.on('connect', () => console.log('✅ Connexion établie'));
  redis.on('ready', () => console.log('🚀 Redis prêt'));
  redis.on('error', (err) => console.error('❌ Erreur:', err.message));
  redis.on('close', () => console.log('⚠️ Connexion fermée'));
  redis.on('reconnecting', () => console.log('🔄 Reconnexion...'));

  try {
    console.log('🔍 Test PING...');
    const pong = await redis.ping();
    console.log('✅ PING réussi:', pong);

    console.log('🔍 Test SET/GET...');
    await redis.set('test:' + Date.now(), 'hello upstash');
    const value = await redis.get('test:' + Date.now());
    console.log('✅ SET/GET réussi');

    console.log('🔍 Test INFO...');
    const info = await redis.info('server');
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
    console.log('✅ Version Redis:', version);

    console.log('\n🎉 Tous les tests réussis !');
    
  } catch (error) {
    console.error('\n❌ Test échoué:', error.message);
    
    // Diagnostics supplémentaires
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Suggestions:');
      console.log('  - Vérifiez que votre URL Upstash est correcte');
      console.log('  - Vérifiez votre connexion internet');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Suggestions:');
      console.log('  - Vérifiez que votre database Upstash est active');
      console.log('  - Vérifiez les restrictions IP dans Upstash');
    } else if (error.message.includes('NOAUTH')) {
      console.log('💡 Suggestions:');
      console.log('  - Vérifiez votre mot de passe Redis');
      console.log('  - Régénérez votre URL de connexion dans Upstash');
    }
  } finally {
    await redis.disconnect();
    console.log('🔌 Connexion fermée');
  }
}

debugUpstashConnection().catch(console.error);