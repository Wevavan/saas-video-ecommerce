import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './users.routes'
import videoRoutes from './videos.routes'
import generateRoutes from './generate.routes'
import testRoutes from './test.routes'
import uploadRoutes from './upload.route';

const router = Router()

// Routes principales
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/videos', videoRoutes)
router.use('/generate', generateRoutes)
router.use('/upload', uploadRoutes);

// Routes de test
router.use('/test', testRoutes)

// Route health directement accessible
router.get('/health', (req, res) => {
  res.redirect('/api/test/health')
})

export default router