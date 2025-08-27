// src/config/database.config.ts - VERSION CORRIGÉE AVEC LES BONS EXPORTS
import mongoose, { ConnectOptions } from 'mongoose';

// Configuration optimisée avec seulement les options valides
const getOptimizedOptions = (): ConnectOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Connection pooling optimisé
    maxPoolSize: isProduction ? 50 : 10,
    minPoolSize: isProduction ? 5 : 2,
    maxIdleTimeMS: 30000,
    
    // Timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    
    // Reliability - seulement les options supportées
    retryWrites: true,
  };
};

// Fonction simple compatible avec votre server.ts existant
export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    console.log('🔗 Connecting to MongoDB...');

    const options = getOptimizedOptions();
    const connection = await mongoose.connect(mongoUri, options);
    
    console.log('✅ MongoDB connected successfully:', {
      host: connection.connection.host,
      database: connection.connection.name,
    });

    // Setup des event listeners
    setupEventListeners();
    
    // Setup des indexes de manière optionnelle
    setupDatabaseIndexes().catch(error => {
      console.warn('⚠️  Index setup failed (non-critical):', error.message);
    });

    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

// Event listeners pour MongoDB
const setupEventListeners = (): void => {
  const db = mongoose.connection;

  db.on('connected', () => {
    console.log('📡 MongoDB connected');
  });

  db.on('error', (error: Error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

  db.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  db.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });

  // Gestion propre des signaux d'arrêt
  process.on('SIGINT', async () => {
    await mongoose.disconnect();
    console.log('👋 MongoDB disconnected on app termination');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.disconnect();
    console.log('👋 MongoDB disconnected on app termination');
    process.exit(0);
  });
};

// Setup des indexes optimisés (optionnel)
const setupDatabaseIndexes = async (): Promise<void> => {
  try {
    console.log('📊 Setting up database indexes...');

    // Vérifier que la connexion est établie
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️  Database not connected, skipping index setup');
      return;
    }

    // Indexes pour Users (avec gestion d'erreur)
    try {
      await mongoose.connection.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { username: 1 }, unique: true },
        { key: { createdAt: 1 } },
        { key: { lastActive: 1 } },
      ]);
      console.log('✅ Users indexes created');
    } catch (error) {
      console.log('ℹ️  Users indexes already exist');
    }

    // Indexes pour Videos (avec gestion d'erreur)
    try {
      await mongoose.connection.collection('videos').createIndexes([
        { key: { userId: 1, createdAt: -1 } },
        { key: { taskId: 1 }, unique: true },
        { key: { status: 1 } },
      ]);
      console.log('✅ Videos indexes created');
    } catch (error) {
      console.log('ℹ️  Videos indexes already exist');
    }

    // Indexes pour Images (avec gestion d'erreur)
    try {
      await mongoose.connection.collection('images').createIndexes([
        { key: { userId: 1, createdAt: -1 } },
        { key: { filename: 1 } },
      ]);
      console.log('✅ Images indexes created');
    } catch (error) {
      console.log('ℹ️  Images indexes already exist');
    }

    // Indexes pour CreditTransactions (avec gestion d'erreur)
    try {
      await mongoose.connection.collection('credittransactions').createIndexes([
        { key: { userId: 1, createdAt: -1 } },
        { key: { type: 1 } },
      ]);
      console.log('✅ CreditTransactions indexes created');
    } catch (error) {
      console.log('ℹ️  CreditTransactions indexes already exist');
    }

    console.log('🎯 Database indexes setup completed');
  } catch (error) {
    console.error('❌ Failed to create database indexes:', (error as Error).message);
    // Ne pas faire échouer l'application pour les indexes
  }
};

// Classe pour gérer la connexion (optionnelle, pour compatibilité future)
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<typeof mongoose> {
    return connectDatabase();
  }

  isConnectionHealthy(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async getConnectionStats(): Promise<any> {
    try {
      if (!this.isConnectionHealthy()) {
        return { connected: false };
      }

      return {
        connected: true,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
      };
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return { connected: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      if (!this.isConnectionHealthy()) {
        return { healthy: false, latency: 0, error: 'Not connected' };
      }

      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - startTime;
      
      return { healthy: true, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { 
        healthy: false, 
        latency, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Exports pour compatibilité
export const databaseConnection = DatabaseConnection.getInstance();
export const initializeDatabase = connectDatabase; // Alias pour compatibilité

// Export par défaut
export default { connectDatabase, DatabaseConnection, databaseConnection };