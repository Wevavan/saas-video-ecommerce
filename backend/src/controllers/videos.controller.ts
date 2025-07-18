import { Response, NextFunction } from 'express'
import { Video } from '@/models/Video.model'
import { AuthenticatedRequest } from '@/types/auth.types'
import { sendResponse } from '@/utils/response.util'

class VideoController {
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
}

export const videoController = new VideoController()