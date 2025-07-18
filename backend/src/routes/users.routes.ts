import { Router } from 'express'
import { userController } from '@/controllers/users.controller'
import { authenticateToken } from '@/middleware/auth.middleware'
import { validateBody, validateParams } from '@/middleware/validation.middleware'
import { updateUserSchema, idParamSchema } from '@/utils/validation.schemas'

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(authenticateToken)

router.get('/me', userController.getProfile)
router.put('/me', validateBody(updateUserSchema), userController.updateProfile)
router.delete('/me', userController.deleteAccount)

router.get('/:id', validateParams(idParamSchema), userController.getUserById)

export default router