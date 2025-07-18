import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { User } from '../models/User.model'
import { Video } from '../models/Video.model'
import { Subscription } from '../models/Subscription.model'
import { sendResponse, sendError } from '../utils/response.util'

class TestController {
  // GET /api/health - Status du serveur + DB
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Vérifier la connexion MongoDB
      const dbStatus = mongoose.connection.readyState
      const dbStates = {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
      }

      // Stats de la base de données
      const userCount = await User.countDocuments()
      const videoCount = await Video.countDocuments()
      const subscriptionCount = await Subscription.countDocuments()

      // Informations système
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      }

      sendResponse(res, 200, {
        success: true,
        message: 'Backend API opérationnel',
        timestamp: new Date().toISOString(),
        server: {
          status: 'running',
          environment: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 3001,
          version: '1.0.0'
        },
        database: {
          status: dbStates[dbStatus as keyof typeof dbStates] || 'unknown',
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          collections: {
            users: userCount,
            videos: videoCount,
            subscriptions: subscriptionCount
          }
        },
        system: systemInfo
      })
    } catch (error) {
      console.error('❌ Erreur health check:', error)
      next(error)
    }
  }

  // POST /api/test/user - Créer un utilisateur test
  async createTestUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, plan = 'free', credits = 10 } = req.body

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        sendError(res, 400, 'Utilisateur test déjà existant avec cet email')
        return
      }

      // Créer l'utilisateur test
      const testUser = new User({
        name,
        email,
        password,
        plan,
        credits,
        role: 'user',
        isVerified: true, // Auto-vérification pour les tests
        profile: {
          company: 'Test Company'
        },
        settings: {
          notifications: true,
          emailMarketing: false,
          language: 'fr'
        }
      })

      await testUser.save()

      // Créer une subscription test si plan != free
      if (plan !== 'free') {
        const testSubscription = new Subscription({
          userId: testUser._id,
          stripeCustomerId: `test_cus_${Date.now()}`,
          stripeSubscriptionId: `test_sub_${Date.now()}`,
          stripePriceId: `test_price_${plan}`,
          plan: {
            name: plan,
            creditsPerMonth: plan === 'pro' ? 100 : 1000,
            price: plan === 'pro' ? 9.99 : 29.99,
            currency: 'EUR',
            features: plan === 'pro' ? ['HD Videos', 'No Watermark'] : ['HD Videos', 'No Watermark', 'Priority Support']
          },
          status: 'active',
          billing: {
            interval: 'month',
            intervalCount: 1,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            cancelAtPeriodEnd: false
          },
          usage: {
            creditsUsed: 0,
            creditsRemaining: credits,
            videosGenerated: 0,
            lastResetDate: new Date()
          }
        })

        await testSubscription.save()
      }

      sendResponse(res, 201, {
        success: true,
        message: 'Utilisateur test créé avec succès',
        user: {
          id: testUser._id,
          name: testUser.name,
          email: testUser.email,
          plan: testUser.plan,
          credits: testUser.credits,
          role: testUser.role,
          isVerified: testUser.isVerified,
          createdAt: testUser.createdAt
        }
      })
    } catch (error) {
      console.error('❌ Erreur création utilisateur test:', error)
      next(error)
    }
  }

  // GET /api/test/users - Lister les utilisateurs
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, plan, search } = req.query

      // Construire le filtre
      const filter: any = {}
      if (plan) {
        filter.plan = plan
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit)

      // Requête avec population des subscriptions
      const users = await User.find(filter)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()

      const total = await User.countDocuments(filter)

      // Ajouter les informations de subscription pour chaque utilisateur
      const usersWithSubscriptions = await Promise.all(
        users.map(async (user) => {
          const subscription = await Subscription.findOne({ userId: user._id }).lean()
          return {
            ...user,
            subscription: subscription ? {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodEnd: subscription.billing.currentPeriodEnd,
              creditsRemaining: subscription.usage.creditsRemaining
            } : null
          }
        })
      )

      // Stats rapides
      const stats = {
        total,
        byPlan: {
          free: await User.countDocuments({ ...filter, plan: 'free' }),
          pro: await User.countDocuments({ ...filter, plan: 'pro' }),
          enterprise: await User.countDocuments({ ...filter, plan: 'enterprise' })
        },
        verified: await User.countDocuments({ ...filter, isVerified: true }),
        unverified: await User.countDocuments({ ...filter, isVerified: false })
      }

      sendResponse(res, 200, {
        success: true,
        message: 'Liste des utilisateurs récupérée',
        data: usersWithSubscriptions,
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
      next(error)
    }
  }

  // DELETE /api/test/users - Nettoyer les utilisateurs test
  async cleanupTestUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Supprimer les utilisateurs test (ceux avec email contenant 'test')
      const deleteResult = await User.deleteMany({
        email: { $regex: 'test', $options: 'i' }
      })

      // Supprimer les subscriptions orphelines
      const subscriptionsDeleted = await Subscription.deleteMany({
        stripeCustomerId: { $regex: 'test_cus_', $options: 'i' }
      })

      sendResponse(res, 200, {
        success: true,
        message: 'Nettoyage terminé',
        deleted: {
          users: deleteResult.deletedCount,
          subscriptions: subscriptionsDeleted.deletedCount
        }
      })
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error)
      next(error)
    }
  }

  // GET /api/test/database - Tester les opérations DB
  async testDatabase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tests = []

      // Test 1: Connexion MongoDB
      try {
        await mongoose.connection.db?.admin().ping()
        tests.push({ name: 'MongoDB Ping', status: 'success', duration: '< 1ms' })
      } catch (error) {
        tests.push({ name: 'MongoDB Ping', status: 'failed', error: error })
      }

      // Test 2: Lecture User
      try {
        const startTime = Date.now()
        await User.findOne().limit(1)
        const duration = Date.now() - startTime
        tests.push({ name: 'User Read', status: 'success', duration: `${duration}ms` })
      } catch (error) {
        tests.push({ name: 'User Read', status: 'failed', error: error })
      }

      // Test 3: Écriture/Suppression rapide
      try {
        const startTime = Date.now()
        const testDoc = new User({
          name: 'Test Speed',
          email: `speed-test-${Date.now()}@test.com`,
          password: 'test123',
          plan: 'free'
        })
        await testDoc.save()
        await User.deleteOne({ _id: testDoc._id })
        const duration = Date.now() - startTime
        tests.push({ name: 'Write/Delete Speed', status: 'success', duration: `${duration}ms` })
      } catch (error) {
        tests.push({ name: 'Write/Delete Speed', status: 'failed', error: error })
      }

      // Test 4: Index performance
      try {
        const startTime = Date.now()
        await User.findOne({ email: 'non-existent@test.com' })
        const duration = Date.now() - startTime
        tests.push({ name: 'Index Performance', status: 'success', duration: `${duration}ms` })
      } catch (error) {
        tests.push({ name: 'Index Performance', status: 'failed', error: error })
      }

      const successCount = tests.filter(test => test.status === 'success').length
      const overallStatus = successCount === tests.length ? 'healthy' : 'degraded'

      sendResponse(res, 200, {
        success: true,
        message: 'Tests de base de données terminés',
        status: overallStatus,
        results: tests,
        summary: {
          total: tests.length,
          passed: successCount,
          failed: tests.length - successCount
        }
      })
    } catch (error) {
      console.error('❌ Erreur test database:', error)
      next(error)
    }
  }
}

export const testController = new TestController()