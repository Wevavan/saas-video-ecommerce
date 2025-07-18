import { Router } from 'express'
import { Request, Response } from 'express'
import { User } from '../models/User.model'
import mongoose from 'mongoose'

const router = Router()

// GET /api/test/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbStatus = mongoose.connection.readyState
    const userCount = await User.countDocuments()

    res.json({
      success: true,
      message: 'Health check OK',
      timestamp: new Date().toISOString(),
      server: {
        status: 'running',
        port: process.env.PORT || 3001,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: dbStatus === 1 ? 'connected' : 'disconnected',
        userCount
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur health check',
      error: error
    })
  }
})

// POST /api/test/user
router.post('/user', async (req: Request, res: Response) => {
  try {
    const { name, email, password, plan = 'free', credits = 10 } = req.body

    // Validation basique
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email et password requis'
      })
    }

    // Vérifier si existe déjà
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur déjà existant'
      })
    }

    // Créer utilisateur
    const user = new User({
      name,
      email,
      password,
      role: 'user',
      plan,
      credits,
      isVerified: true
    })

    await user.save()

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        credits: user.credits,
        role: user.role,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur création utilisateur',
      error: error
    })
  }
})

// GET /api/test/users - ROUTE MANQUANTE AJOUTÉE
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, plan } = req.query

    // Construire le filtre
    const filter: any = {}
    if (plan) {
      filter.plan = plan
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit)

    // Récupérer les utilisateurs
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await User.countDocuments(filter)

    // Stats par plan
    const stats = {
      total,
      byPlan: {
        free: await User.countDocuments({ plan: 'free' }),
        pro: await User.countDocuments({ plan: 'pro' }),
        enterprise: await User.countDocuments({ plan: 'enterprise' })
      }
    }

    res.json({
      success: true,
      message: 'Liste des utilisateurs récupérée',
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      stats
    })
  } catch (error) {
    console.error('❌ Erreur liste utilisateurs:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur récupération utilisateurs',
      error: error
    })
  }
})

// DELETE /api/test/users - Nettoyer les utilisateurs test
router.delete('/users', async (req: Request, res: Response) => {
  try {
    // Supprimer les utilisateurs test (ceux avec email contenant 'test')
    const deleteResult = await User.deleteMany({
      email: { $regex: 'test', $options: 'i' }
    })

    res.json({
      success: true,
      message: 'Nettoyage terminé',
      deleted: deleteResult.deletedCount
    })
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur nettoyage',
      error: error
    })
  }
})

export default router