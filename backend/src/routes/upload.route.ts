import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.middleware'; // ✅ Corrigé
import { 
  uploadImages, 
  uploadMiddleware, 
  serveImage, 
  deleteImage,
  getImageInfo // ✅ Nouvelle fonction
} from '../controllers/upload.controller';

const router = Router();

// Rate limiting spécialisé pour l'upload
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 uploads par 15 minutes par IP
  message: {
    error: 'Trop de tentatives d\'upload. Réessayez dans 15 minutes.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour la suppression
const deleteRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 suppressions par 5 minutes
  message: {
    error: 'Trop de suppressions. Réessayez dans 5 minutes.'
  }
});

// Routes protégées (nécessitent une authentification)

/**
 * @route POST /api/upload/images
 * @desc Upload d'images sans compression (version simplifiée)
 * @access Private
 * @body multipart/form-data avec field "images" (max 5 fichiers)
 * @returns {Object} Liste des images uploadées avec métadonnées
 */
router.post('/images', 
  uploadRateLimit,
  authenticateToken, // ✅ Corrigé
  uploadMiddleware,
  uploadImages
);

/**
 * @route DELETE /api/upload/image/:filename
 * @desc Suppression d'une image uploadée
 * @access Private
 * @param {string} filename - Nom du fichier à supprimer
 * @returns {Object} Confirmation de suppression
 */
router.delete('/image/:filename',
  deleteRateLimit,
  authenticateToken, // ✅ Corrigé
  deleteImage
);

// Routes publiques

/**
 * @route GET /api/upload/image/:filename
 * @desc Récupération d'une image uploadée
 * @access Public
 * @param {string} filename - Nom du fichier image
 * @returns {File} Fichier image
 */
router.get('/image/:filename', serveImage);

/**
 * @route GET /api/upload/info/:filename
 * @desc Informations sur une image uploadée
 * @access Public
 * @param {string} filename - Nom du fichier image
 * @returns {Object} Métadonnées de l'image
 */
router.get('/info/:filename', getImageInfo);

export default router;