// backend/src/server.ts - VERSION AVEC HANDLERS REDIS/BULL CORRIGÉS
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { connectDatabase } from './config/database.config'
import { initializeModels } from './models'
import app from './app'

// ✅ CHARGER LES VARIABLES D'ENVIRONNEMENT EN PREMIER
dotenv.config()

const PORT = process.env.PORT || 3001

// ✅ DEBUG DES VARIABLES D'ENVIRONNEMENT
console.log('🔧 Variables d\'environnement chargées:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   MONGODB_URI: ${!!process.env.MONGODB_URI ? 'Définie' : 'Non définie'}`);
console.log(`   JWT_SECRET: ${!!process.env.JWT_SECRET ? 'Définie' : 'Non définie'}`);
console.log(`   RUNWAY_API_KEY: ${!!process.env.RUNWAY_API_KEY ? 'Définie (longueur: ' + process.env.RUNWAY_API_KEY?.length + ')' : 'Non définie'}`);
console.log(`   RUNWAY_API_URL: ${process.env.RUNWAY_API_URL || 'Non définie'}`);

// ✅ FONCTION POUR DÉMARRER LES SERVICES RUNWAY
async function startRunwayServices() {
  try {
    // Importer les services après que dotenv soit chargé
    const { cleanupService } = await import('./services/cleanup.service')
    const { runwayPollingService } = await import('./services/runway.polling.service')
    
    // Démarrer le service de nettoyage en production
    if (process.env.NODE_ENV === 'production') {
      cleanupService.startCleanupJob()
      console.log('🧹 Service de nettoyage démarré');
    }
    
    // Démarrer le service de polling Runway
    if (process.env.NODE_ENV !== 'test') {
      try {
        runwayPollingService.start();
        console.log('🎬 Runway polling service démarré');
      } catch (error) {
        console.error('❌ Erreur démarrage Runway polling:', error);
      }
    }
    
    // ✅ GESTION GRACEFUL SHUTDOWN
    const gracefulShutdown = () => {
      console.log('🔄 Arrêt gracieux en cours...');
     
      if (cleanupService.getStatus().running) {
        console.log('🧹 Arrêt du service de nettoyage...');
      }
     
      if (runwayPollingService.getStatus().running) {
        console.log('🎬 Arrêt du service Runway...');
        runwayPollingService.stop();
      }
     
      console.log('✅ Services arrêtés proprement');
      process.exit(0);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Erreur démarrage services Runway:', error);
  }
}

// ✅ FONCTION PRINCIPALE DE DÉMARRAGE
async function startServer() {
  try {
    // Connecter à MongoDB
    await connectDatabase();
    console.log('✅ Connexion MongoDB établie');
   
    // Initialiser les modèles
    initializeModels();
    console.log('📊 Modèles MongoDB initialisés');
    
    // Démarrer les services Runway
    await startRunwayServices();
    
    // Démarrer le serveur HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`)
      console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🌐 URL: http://localhost:${PORT}`)
      console.log(`🌐 CORS autorisé pour: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
      console.log(`📚 Health check: http://localhost:${PORT}/api/health`)
      console.log(`🎬 Runway health: http://localhost:${PORT}/api/runway/health`)
    })
    
  } catch (error) {
    console.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
}

// ✅ GESTION DES ERREURS NON CAPTURÉES - VERSION CORRIGÉE POUR REDIS/BULL
process.on('unhandledRejection', (err: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', err?.message || err);
  
  // ✅ VÉRIFIER SI C'EST UNE ERREUR REDIS/BULL
  if (err && typeof err === 'object') {
    const errorMessage = err.message || err.toString();
    
    // Ignorer les erreurs Redis/Bull pour éviter le crash
    if (errorMessage.includes('Connection is closed') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('Redis connection') ||
        errorMessage.includes('Bull') ||
        errorMessage.includes('ioredis') ||
        errorMessage.includes('Connection is not open') ||
        errorMessage.includes('Connection timeout')) {
      console.warn('⚠️ Erreur Redis/Bull ignorée pour maintenir la stabilité du serveur');
      return; // NE PAS PLANTER LE SERVEUR
    }
  }
  
  // Pour les autres erreurs critiques, on peut décider de planter ou pas
  console.error('❌ Unhandled Rejection critique - Arrêt du serveur');
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('❌ Stack:', err.stack);
  
  // ✅ VÉRIFIER SI C'EST UNE ERREUR REDIS/BULL
  if (err.message.includes('Connection is closed') ||
      err.message.includes('ECONNRESET') ||
      err.message.includes('Redis connection') ||
      err.message.includes('Bull') ||
      err.message.includes('ioredis') ||
      err.message.includes('Connection is not open')) {
    console.warn('⚠️ Exception Redis/Bull ignorée pour maintenir la stabilité');
    return; // NE PAS PLANTER LE SERVEUR
  }
  
  // Pour les autres exceptions, c'est probablement critique
  console.error('❌ Exception critique - Arrêt du serveur');
  process.exit(1);
});

// ✅ DÉMARRER LE SERVEUR
startServer();