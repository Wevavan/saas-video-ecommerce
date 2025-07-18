import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ✅ Fonction de réponse compatible avec ton système
const sendResponse = (res: Response, success: boolean, data?: any, message?: string, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success,
    message,
    data
  });
};

const sendError = (res: Response, message: string, statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

// Fonction de sanitization des noms de fichiers
const sanitizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_') // Remplace les caractères spéciaux
    .replace(/_+/g, '_') // Évite les underscores multiples
    .replace(/^_+|_+$/g, ''); // Supprime les underscores en début/fin
};

// Configuration Multer avec stockage sur disque
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const sanitizedOriginalName = sanitizeFilename(
      path.basename(file.originalname, fileExtension)
    );
    const uniqueFilename = `${uuidv4()}_${sanitizedOriginalName}${fileExtension}`;
    cb(null, uniqueFilename);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validation des types MIME autorisés
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou WebP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5 // Max 5 fichiers simultanés
  }
});

// Middleware pour gérer les erreurs Multer
export const uploadMiddleware = (req: Request, res: Response, next: Function) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'Fichier trop volumineux (max 5MB)', 400);
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return sendError(res, 'Trop de fichiers (max 5)', 400);
      }
      return sendError(res, 'Erreur upload: ' + err.message, 400);
    }
    if (err) {
      return sendError(res, err.message, 400);
    }
    next();
  });
};

// Interface pour les métadonnées d'image (version simplifiée)
interface ImageMetadata {
  filename: string;
  originalname: string;
  size: number;
  format: string;
  url: string;
  mimetype: string;
  uploadedAt: string;
}

// Contrôleur principal pour l'upload d'images (SANS SHARP)
export const uploadImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return sendError(res, 'Aucun fichier fourni', 400);
    }

    const processedImages: ImageMetadata[] = [];

    // Traitement de chaque image (sans compression)
    for (const file of files) {
      try {
        // Construction de l'URL d'accès
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? process.env.BASE_URL || 'http://localhost:3001'
          : 'http://localhost:3001';
        
        const imageUrl = `${baseUrl}/uploads/${file.filename}`;

        // Métadonnées de l'image
        const imageMetadata: ImageMetadata = {
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          format: path.extname(file.originalname).toLowerCase().replace('.', ''),
          url: imageUrl,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString()
        };

        processedImages.push(imageMetadata);

        console.log(`✅ Image uploadée: ${file.filename} (${Math.round(file.size/1024)}KB)`);

      } catch (imageError) {
        console.error('Erreur traitement image:', imageError);
        // Continue avec les autres images même si une échoue
      }
    }

    if (processedImages.length === 0) {
      return sendError(res, 'Aucune image n\'a pu être traitée', 500);
    }

    return sendResponse(res, true, {
      message: `${processedImages.length} image(s) uploadée(s) avec succès`,
      images: processedImages,
      total: processedImages.length
    }, `${processedImages.length} image(s) uploadée(s) avec succès`);

  } catch (error) {
    console.error('Erreur upload images:', error);
    return sendError(res, 'Erreur lors de l\'upload des images', 500);
  }
};

// Contrôleur pour servir les images uploadées
export const serveImage = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validation et sanitization du nom de fichier
    const sanitizedFilename = sanitizeFilename(filename);
    const filepath = path.join(process.cwd(), 'uploads', sanitizedFilename);

    // Vérification de l'existence du fichier
    try {
      await fs.access(filepath);
    } catch {
      return sendError(res, 'Image non trouvée', 404);
    }

    // Détection du type MIME basé sur l'extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };

    const contentType = mimeTypes[ext] || 'image/jpeg';

    // Headers pour cache et sécurité
    res.set({
      'Cache-Control': 'public, max-age=31536000', // Cache 1 an
      'Content-Type': contentType
    });

    return res.sendFile(path.resolve(filepath));

  } catch (error) {
    console.error('Erreur serving image:', error);
    return sendError(res, 'Erreur lors du chargement de l\'image', 500);
  }
};

// Contrôleur pour supprimer une image
export const deleteImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename } = req.params;
    
    const sanitizedFilename = sanitizeFilename(filename);
    const filepath = path.join(process.cwd(), 'uploads', sanitizedFilename);

    try {
      await fs.unlink(filepath);
      console.log(`🗑️ Image supprimée: ${sanitizedFilename}`);
      return sendResponse(res, true, {
        message: 'Image supprimée avec succès',
        filename: sanitizedFilename
      }, 'Image supprimée avec succès');
    } catch {
      return sendError(res, 'Image non trouvée', 404);
    }

  } catch (error) {
    console.error('Erreur suppression image:', error);
    return sendError(res, 'Erreur lors de la suppression', 500);
  }
};

// Contrôleur pour obtenir des informations sur une image
export const getImageInfo = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const sanitizedFilename = sanitizeFilename(filename);
    const filepath = path.join(process.cwd(), 'uploads', sanitizedFilename);

    try {
      const stats = await fs.stat(filepath);
      const ext = path.extname(sanitizedFilename).toLowerCase();
      
      const imageInfo = {
        filename: sanitizedFilename,
        size: stats.size,
        format: ext.replace('.', ''),
        uploadedAt: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString(),
        url: `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/${sanitizedFilename}`
      };

      return sendResponse(res, true, imageInfo, 'Informations de l\'image récupérées');
    } catch {
      return sendError(res, 'Image non trouvée', 404);
    }

  } catch (error) {
    console.error('Erreur récupération info image:', error);
    return sendError(res, 'Erreur lors de la récupération des informations', 500);
  }
};

// Fonction de nettoyage des anciens fichiers (pour cron job)
export const cleanupOldFiles = async (maxAgeHours: number = 24): Promise<void> => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Vérifier que le dossier existe
    try {
      await fs.access(uploadDir);
    } catch {
      console.log('Dossier uploads n\'existe pas encore');
      return;
    }

    const files = await fs.readdir(uploadDir);
    const now = Date.now();
    
    let deletedCount = 0;

    for (const file of files) {
      const filepath = path.join(uploadDir, file);
      try {
        const stats = await fs.stat(filepath);
        const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > maxAgeHours) {
          await fs.unlink(filepath);
          deletedCount++;
          console.log(`🗑️ Fichier ancien supprimé: ${file} (${Math.round(ageHours)}h)`);
        }
      } catch (fileError) {
        console.error(`Erreur traitement fichier ${file}:`, fileError);
      }
    }

    console.log(`🧹 Nettoyage terminé: ${deletedCount} fichier(s) supprimé(s)`);
  } catch (error) {
    console.error('Erreur nettoyage fichiers:', error);
  }
};