import mongoose from 'mongoose'

interface ConnectionOptions {
  maxPoolSize?: number
  serverSelectionTimeoutMS?: number
  socketTimeoutMS?: number
  connectTimeoutMS?: number
}

export const connectDatabase = async (options: ConnectionOptions = {}): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas-video-db'
    
    const defaultOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      ...options
    }

    await mongoose.connect(mongoUri, defaultOptions)
    
    console.log('✅ MongoDB connecté avec succès')
    console.log(`📊 Base de données: ${mongoose.connection.db?.databaseName}`)
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`)
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error)
    process.exit(1)
  }
}

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connecté à MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur Mongoose:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose déconnecté')
  
  // Tentative de reconnexion automatique en production seulement
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Tentative de reconnexion...')
    setTimeout(() => {
      connectDatabase()
    }, 5000)
  }
})

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnecté')
})

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close()
    console.log('✅ Connexion MongoDB fermée proprement')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error)
    process.exit(1)
  }
})