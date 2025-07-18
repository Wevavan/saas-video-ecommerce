import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@/types/auth.types'
import { sendResponse } from '@/utils/response.util'
import { generateService } from './generate.service'


class GenerateController {
  async generateVideo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId, productData, settings } = req.body
      const userId = req.user!._id

      // Démarrer la génération vidéo
      const jobId = await generateService.startVideoGeneration({
        templateId,
        productData,
        settings,
        userId
      })

      sendResponse(res, 202, {
        success: true,
        message: 'Génération vidéo démarrée',
        data: {
          jobId,
          status: 'processing'
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await generateService.getAvailableTemplates()

      sendResponse(res, 200, {
        success: true,
        message: 'Templates récupérés avec succès',
        data: templates
      })
    } catch (error) {
      next(error)
    }
  }

  async getGenerationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params
      const userId = req.user!._id

      const status = await generateService.getGenerationStatus(jobId, userId)

      if (!status) {
        res.status(404).json({
          success: false,
          message: 'Job de génération non trouvé'
        })
        return
      }

      sendResponse(res, 200, {
        success: true,
        message: 'Statut récupéré avec succès',
        data: status
      })
    } catch (error) {
      next(error)
    }
  }
}

export const generateController = new GenerateController()