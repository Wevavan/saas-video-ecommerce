// backend/src/routes/queue.routes.ts - VERSION CORRIGÉE
import { Router, Response } from 'express';
import { queueService } from '../services/queue.service';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Schema de validation pour création de job
const createJobSchema = z.object({
  imageUrl: z.string().url(),
  productInfo: z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    price: z.number().positive(),
    category: z.string(),
    targetAudience: z.string(),
  }),
  style: z.enum(['moderne', 'luxe', 'jeune', 'professionnel', 'b2b']),
  voiceSettings: z.object({
    voiceId: z.string(),
    speed: z.number().min(0.5).max(2),
    pitch: z.number().min(-20).max(20),
  }),
  duration: z.number().min(10).max(60),
});

// Créer un nouveau job de génération vidéo
router.post('/generate', 
  authenticateToken, 
  validateBody(createJobSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const jobData = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ...req.body,
        createdAt: new Date(),
      };

      const jobId = await queueService.addVideoGenerationJob(jobData, {
        priority: req.user?.plan === 'enterprise' ? 10 : (req.user?.plan === 'pro' ? 5 : 0), // Priorité selon le plan
      });

      res.status(201).json({
        success: true,
        message: 'Job de génération vidéo créé avec succès',
        data: {
          jobId,
          estimatedTime: 180, // 3 minutes
          creditsEstimated: Math.ceil(req.body.duration / 10) * 5,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating video generation job:', errorMessage);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du job',
        error: errorMessage,
      });
    }
  }
);

// Récupérer le statut d'un job
router.get('/status/:jobId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const status = await queueService.getJobStatus(jobId);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting job status:', errorMessage);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
      error: errorMessage,
    });
  }
});

// Annuler un job
router.delete('/cancel/:jobId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const cancelled = await queueService.cancelJob(jobId);
    
    if (cancelled) {
      res.json({
        success: true,
        message: 'Job annulé avec succès',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Job introuvable ou déjà terminé',
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error canceling job:', errorMessage);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du job',
      error: errorMessage,
    });
  }
});

// Dashboard admin - statistiques queue
router.get('/admin/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Accès refusé - Admin requis',
      });
      return;
    }

    const [stats, health] = await Promise.all([
      queueService.getQueueStats(),
      queueService.getHealthStatus(),
    ]);

    res.json({
      success: true,
      data: {
        stats,
        health,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting queue admin stats:', errorMessage);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: errorMessage,
    });
  }
});

export { router as queueRoutes };