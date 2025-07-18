import { Router } from 'express'
import { generateController } from '@/controllers/generate.controller'
import { authenticateToken } from '@/middleware/auth.middleware'
import { validateBody } from '@/middleware/validation.middleware'
import { generateVideoSchema } from '@/utils/validation.schemas'

const router = Router()

// Authentification requise
router.use(authenticateToken)

router.post('/video', validateBody(generateVideoSchema), generateController.generateVideo)
router.get('/templates', generateController.getTemplates)
router.get('/status/:jobId', generateController.getGenerationStatus)

export default router