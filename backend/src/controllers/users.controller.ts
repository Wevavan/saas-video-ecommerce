import { Response, NextFunction } from 'express'
import { User } from '@/models/User.model'
import { AuthenticatedRequest } from '@/types/auth.types'
import { sendResponse } from '@/utils/response.util'

class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user!._id)
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        })
        return
      }

      sendResponse(res, 200, {
        success: true,
        message: 'Profil récupéré avec succès',
        data: user.toJSON()
      })
    } catch (error) {
      next(error)
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, avatar } = req.body
      const userId = req.user!._id

      // Vérifier si l'email est déjà utilisé
      if (email && email !== req.user!.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } })
        if (existingUser) {
          res.status(400).json({
            success: false,
            message: 'Cet email est déjà utilisé'
          })
          return
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { name, email, avatar },
        { new: true, runValidators: true }
      )

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        })
        return
      }

      sendResponse(res, 200, {
        success: true,
        message: 'Profil mis à jour avec succès',
        data: user.toJSON()
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id

      await User.findByIdAndDelete(userId)

      res.status(200).json({
        success: true,
        message: 'Compte supprimé avec succès'
      })
    } catch (error) {
      next(error)
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const user = await User.findById(id)

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        })
        return
      }

      sendResponse(res, 200, {
        success: true,
        message: 'Utilisateur récupéré avec succès',
        data: user.toJSON()
      })
    } catch (error) {
      next(error)
    }
  }
}

export const userController = new UserController()