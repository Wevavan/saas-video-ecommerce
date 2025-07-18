import { Router } from 'express'
import { videoController } from '@/controllers/videos.controller'
import { authenticateToken } from '@/middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware'
import { createVideoSchema, updateVideoSchema, idParamSchema, paginationSchema } from '@/utils/validation.schemas'

const router = Router()

// Authentification requise pour toutes les routes
router.use(authenticateToken)

router.get('/', validateQuery(paginationSchema), videoController.getVideos)
router.post('/', validateBody(createVideoSchema), videoController.createVideo)

router.get('/:id', validateParams(idParamSchema), videoController.getVideoById)
router.put('/:id', validateParams(idParamSchema), validateBody(updateVideoSchema), videoController.updateVideo)
router.delete('/:id', validateParams(idParamSchema), videoController.deleteVideo)

export default router