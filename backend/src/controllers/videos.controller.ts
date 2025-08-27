// backend/src/controllers/videos.controller.ts - VERSION ÉTENDUE
import { Response, NextFunction } from 'express'
import { Video } from '@/models/Video.model'
import { AuthenticatedRequest } from '@/types/auth.types'
import { sendResponse } from '@/utils/response.util'

class VideoController {
  // ✅ TES MÉTHODES EXISTANTES (gardées à l'identique)
  async getVideos(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
      const userId = req.user!._id
      
      // Construire la requête
      const query: any = { userId }
      if (search) {
        query.title = { $regex: search, $options: 'i' }
      }
      
      // Calcul de la pagination
      const skip = (Number(page) - 1) * Number(limit)
      
      // Exécuter la requête avec pagination
      const videos = await Video.find(query)
        .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(Number(limit))
      
      const total = await Video.countDocuments(query)
      
      sendResponse(res, 200, {
        success: true,
        message: 'Vidéos récupérées avec succès',
        data: videos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async createVideo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, template, settings } = req.body
      const userId = req.user!._id
      
      const video = new Video({
        title,
        description,
        templateId: template,
        settings,
        userId,
        status: 'processing'
      })
      
      await video.save()
      
      sendResponse(res, 201, {
        success: true,
        message: 'Vidéo créée avec succès',
        data: video
      })
    } catch (error) {
      next(error)
    }
  }

  async getVideoById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.user!._id
      
      const video = await Video.findOne({ _id: id, userId })
      
      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Vidéo non trouvée'
        })
        return
      }
      
      sendResponse(res, 200, {
        success: true,
        message: 'Vidéo récupérée avec succès',
        data: video
      })
    } catch (error) {
      next(error)
    }
  }

  async updateVideo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.user!._id
      const updateData = req.body
      
      const video = await Video.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true, runValidators: true }
      )
      
      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Vidéo non trouvée'
        })
        return
      }
      
      sendResponse(res, 200, {
        success: true,
        message: 'Vidéo mise à jour avec succès',
        data: video
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteVideo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.user!._id
      
      const video = await Video.findOneAndDelete({ _id: id, userId })
      
      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Vidéo non trouvée'
        })
        return
      }
      
      res.status(200).json({
        success: true,
        message: 'Vidéo supprimée avec succès'
      })
    } catch (error) {
      next(error)
    }
  }

  // 🆕 NOUVELLE MÉTHODE: Génération vidéo avec IA (adaptée à ton architecture)
  async generateAiVideo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id
      console.log('🎬 Nouvelle demande génération IA:', {
        userId: userId.toString(),
        product: req.body.productInfo?.name,
        style: req.body.style
      });

      // Import dynamique des services
      const { queueService } = await import('@/services/queue.service');
      const { CreditsService } = await import('@/services/credits.service');

      // Calculer le coût en crédits
      const baseCost = Math.ceil(req.body.duration / 10) * 5;
      const styleCost = req.body.style === 'luxe' ? Math.ceil(baseCost * 1.5) : baseCost;
      const totalCost = styleCost + 3; // +3 crédits pour OpenAI + ElevenLabs

      // Vérifier les crédits avant de créer le job
      const hasCredits = await CreditsService.checkSufficientCredits(userId.toString(), totalCost);
      
      if (!hasCredits) {
        res.status(402).json({
          success: false,
          message: 'Crédits insuffisants pour cette génération',
          required: totalCost,
          error: 'INSUFFICIENT_CREDITS'
        });
        return;
      }

      // Créer les données du job
      const jobData = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId.toString(),
        imageUrl: req.body.imageUrl,
        productInfo: req.body.productInfo,
        style: req.body.style,
        voiceSettings: req.body.voiceSettings,
        duration: req.body.duration,
        createdAt: new Date(),
      };

      // Ajouter le job à la queue avec priorité selon le plan
      const priority = req.user?.plan === 'enterprise' ? 10 : (req.user?.plan === 'pro' ? 5 : 0);
      const jobId = await queueService.addVideoGenerationJob(jobData, { priority });

      console.log('✅ Job IA créé avec succès:', jobId);

      sendResponse(res, 201, {
        success: true,
        message: 'Génération vidéo IA démarrée avec succès',
        data: {
          jobId,
          estimatedTime: 300, // 5 minutes
          creditsRequired: totalCost,
          priority: priority > 0 ? 'premium' : 'standard',
          status: 'queued'
        }
      });

    } catch (error) {
      console.error('❌ Erreur génération IA:', error);
      next(error);
    }
  }

  // 🆕 NOUVELLE MÉTHODE: Statut job génération IA
  async getAiJobStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const { queueService } = await import('@/services/queue.service');
      
      // Récupérer le statut depuis la queue
      const jobStatus = await queueService.getJobStatus(jobId);
      const progress = queueService.getJobProgress(jobId);

      // Récupérer les infos vidéo depuis la DB si complétée
      let videoData = null;
      if (jobStatus.status === 'completed') {
        videoData = await Video.findOne({ jobId }).lean();
      }

      sendResponse(res, 200, {
        success: true,
        message: 'Statut du job récupéré avec succès',
        data: {
          jobId,
          status: jobStatus.status,
          progress: progress ? {
            percentage: progress.percentage,
            stage: progress.stage,
            message: progress.message,
            estimatedTimeRemaining: progress.estimatedTimeRemaining,
            logs: progress.logs.slice(-5) // Derniers 5 logs seulement
          } : null,
          video: videoData ? {
            id: videoData._id,
            title: videoData.title,
            outputVideo: videoData.outputVideo,
            script: videoData.script,
            duration: videoData.duration,
            style: videoData.style,
            createdAt: videoData.createdAt
          } : null,
          result: jobStatus.job || null
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération statut IA:', error);
      next(error);
    }
  }

  // 🆕 NOUVELLE MÉTHODE: Annuler job génération IA
  async cancelAiJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = req.user!._id;
      const { queueService } = await import('@/services/queue.service');

      // Vérifier que le job appartient à l'utilisateur
      const video = await Video.findOne({ jobId, userId });
      
      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Job non trouvé ou non autorisé',
        });
        return;
      }

      // Annuler le job dans la queue
      const cancelled = await queueService.cancelJob(jobId);
      
      if (cancelled) {
        // Marquer la vidéo comme annulée
        await Video.findByIdAndUpdate(video._id, {
          status: 'cancelled',
          generationEndedAt: new Date()
        });

        sendResponse(res, 200, {
          success: true,
          message: 'Job annulé avec succès'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Impossible d\'annuler ce job (déjà terminé ou introuvable)',
        });
      }

    } catch (error) {
      console.error('❌ Erreur annulation job IA:', error);
      next(error);
    }
  }
}

export const videoController = new VideoController()