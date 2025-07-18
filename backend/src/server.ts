import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { connectDatabase } from './config/database.config'
import { initializeModels } from './models'
import app from './app'

// Charger les variables d'environnement
dotenv.config()

const PORT = process.env.PORT || 3001

// Connecter à MongoDB
connectDatabase().then(() => {
  initializeModels()
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Routes de base
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Video SaaS API is running',
    timestamp: new Date().toISOString()
  })
})

// Route de test auth
app.post('/api/auth/test', (req, res) => {
  res.json({
    success: true,
    message: 'Route auth fonctionnelle',
    data: req.body
  })
})

// Connecter à la DB et démarrer le serveur
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`)
    console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🌐 CORS autorisé pour: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  })
})