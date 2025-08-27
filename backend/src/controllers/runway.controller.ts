// backend/src/controllers/runway.controller.ts
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendResponse, sendError } from '../utils/response.util';
import { Video } from '../models/Video.model';

export class RunwayController {
  
  /**
   * POST /api/runway/generate
   * Démarre une génération vidéo
   */
  static async generateVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { imageUrl, prompt, style, duration, aspectRatio } = req.body;
      const userId = req.user!._id.toString();

      // Validation des données
      if (!imageUrl || !prompt || !style) {
        sendError(res, 400, 'imageUrl, prompt et style sont requis');
        return;
      }

      // ✅ CORRECTION: Import dynamique du service
      const { RunwayService } = await import('../services/runway.service');

      // Vérifier que le style est supporté
      const availableStyles = RunwayService.getAvailableStyles();
      if (!availableStyles.includes(style)) {
        sendError(res, 400, `Style non supporté. Styles disponibles: ${availableStyles.join(', ')}`);
        return;
      }

      // Créer une entrée vidéo en base
      const video = new Video({
        userId,
        title: `Vidéo générée - ${style}`,
        description: prompt,
        status: 'queued',
        style,
        inputImageUrl: imageUrl,
        generationStartedAt: new Date()
      });

      await video.save();

      // Lancer la génération Runway
      const runwayResponse = await RunwayService.generateVideo(userId, video._id.toString(), {
        imageUrl,
        prompt,
        style,
        duration,
        aspectRatio
      });

      sendResponse(res, 201, {
        success: true,
        message: 'Génération vidéo démarrée',
        data: {
          videoId: video._id,
          runwayJobId: runwayResponse.id,
          status: runwayResponse.status,
          estimatedDuration: '2-3 minutes'
        }
      });

    } catch (error: any) {
      console.error('❌ Erreur génération:', error.message);
      sendError(res, 500, error.message);
    }
  }

  /**
   * GET /api/runway/status/:jobId
   * Vérifie le statut d'une génération
   */
  static async getGenerationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      // ✅ Import dynamique
      const { RunwayService } = await import('../services/runway.service');
      const status = await RunwayService.checkGenerationStatus(jobId);

      sendResponse(res, 200, {
        success: true,
        data: status
      });

    } catch (error: any) {
      console.error('❌ Erreur statut:', error.message);
      sendError(res, 500, error.message);
    }
  }

  /**
   * GET /api/runway/styles
   * Récupère les styles disponibles
   */
  static async getAvailableStyles(req: Request, res: Response): Promise<void> {
    try {
      // ✅ Import dynamique
      const { RunwayService } = await import('../services/runway.service');
      const styles = RunwayService.getAvailableStyles();
      
      sendResponse(res, 200, {
        success: true,
        data: {
          styles,
          count: styles.length
        }
      });

    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  /**
   * GET /api/runway/stats
   * Statistiques du service
   */
  static async getServiceStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // ✅ Import dynamique des deux services
      const [{ RunwayService }, { runwayPollingService }] = await Promise.all([
        import('../services/runway.service'),
        import('../services/runway.polling.service')
      ]);

      const [serviceStats, pollingStats] = await Promise.all([
        RunwayService.getServiceStats(),
        Promise.resolve(runwayPollingService.getStatus())
      ]);

      sendResponse(res, 200, {
        success: true,
        data: {
          service: serviceStats,
          polling: pollingStats,
          timestamp: new Date()
        }
      });

    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  /**
   * POST /api/runway/cancel/:jobId
   * Annule une génération
   */
  static async cancelGeneration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = req.user!._id.toString();

      // Vérifier que l'utilisateur peut annuler ce job
      const video = await Video.findOne({
        userId,
        runwayJobId: jobId,
        status: { $in: ['queued', 'processing'] }
      });

      if (!video) {
        sendError(res, 404, 'Génération non trouvée ou déjà terminée');
        return;
      }

      // ✅ Import dynamique
      const { RunwayService } = await import('../services/runway.service');
      
      // Annuler sur Runway
      const cancelled = await RunwayService.cancelGeneration(jobId);

      if (cancelled) {
        // Mettre à jour en base
        await Video.findByIdAndUpdate(video._id, {
          status: 'failed',
          generationEndedAt: new Date(),
          error: 'Annulée par l\'utilisateur'
        });

        sendResponse(res, 200, {
          success: true,
          message: 'Génération annulée avec succès'
        });
      } else {
        sendError(res, 500, 'Impossible d\'annuler la génération');
      }

    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }
}