// backend/src/routes/videos.routes.ts - VERSION ÉTENDUE
import { Router } from 'express'
import { videoController } from '@/controllers/videos.controller'
import { authenticateToken } from '@/middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware'
import { 
  createVideoSchema, 
  updateVideoSchema, 
  idParamSchema, 
  paginationSchema,
  generateVideoSchema,      // ✅ Ton schéma existant
  generateAiVideoSchema     // 🆕 Nouveau schéma IA
} from '@/utils/validation.schemas'

const router = Router()

// Authentification requise pour toutes les routes
router.use(authenticateToken)

// ✅ TES ROUTES EXISTANTES (gardées à l'identique)
router.get('/', validateQuery(paginationSchema), videoController.getVideos)
router.post('/', validateBody(createVideoSchema), videoController.createVideo)
router.get('/:id', validateParams(idParamSchema), videoController.getVideoById)
router.put('/:id', validateParams(idParamSchema), validateBody(updateVideoSchema), videoController.updateVideo)
router.delete('/:id', validateParams(idParamSchema), videoController.deleteVideo)

// 🆕 NOUVELLES ROUTES: Génération IA (noms différents pour éviter conflits)
router.post('/generate-ai', validateBody(generateAiVideoSchema), videoController.generateAiVideo)
router.get('/ai-jobs/:jobId/status', videoController.getAiJobStatus)
router.delete('/ai-jobs/:jobId/cancel', videoController.cancelAiJob)

// 🆕 Route de health check des services IA
router.get('/ai/health', async (req, res) => {
  try {
    const services: any = {};
    
    // Test des services IA
    try {
      const { queueService } = await import('@/services/queue.service');
      services.queue = await queueService.getHealthStatus();
    } catch (error: any) {
      services.queue = { status: 'error', error: error.message };
    }
    
    try {
      const { openaiService } = await import('@/services/openai.service');
      services.openai = await openaiService.getServiceHealth();
    } catch (error: any) {
      services.openai = { status: 'not_configured', error: error.message };
    }
    
    try {
      const { elevenLabsService } = await import('@/services/elevenlabs.service');
      services.elevenlabs = await elevenLabsService.getServiceHealth();
    } catch (error: any) {
      services.elevenlabs = { status: 'not_configured', error: error.message };
    }
    
    try {
      const { videoAssemblyService } = await import('@/services/videoAssembly.service');
      services.assembly = await videoAssemblyService.getServiceHealth();
    } catch (error: any) {
      services.assembly = { status: 'not_configured', error: error.message };
    }

    const allHealthy = Object.values(services).every((service: any) => 
      service.status === 'healthy' || service.healthy === true
    );

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      timestamp: new Date(),
      services
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
});

export default router