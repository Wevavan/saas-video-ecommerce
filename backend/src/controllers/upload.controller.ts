// backend/src/controllers/upload.controller.ts - VERSION COMPLÈTE CORRIGÉE

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { existsSync, readdirSync } from 'fs';
import { Image } from '../models/Image.model';
import mongoose from 'mongoose';

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

// Interface pour les métadonnées d'image
interface ImageMetadata {
  filename: string;
  originalname: string;
  size: number;
  format: string;
  url: string;
  mimetype: string;
  uploadedAt: string;
}

// ✅ CONTRÔLEUR PRINCIPAL AVEC SAUVEGARDE MONGODB
export const uploadImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const userId = req.user?._id;
    
    if (!files || files.length === 0) {
      return sendError(res, 'Aucun fichier fourni', 400);
    }

    if (!userId) {
      return sendError(res, 'Utilisateur non authentifié', 401);
    }

    const processedImages: ImageMetadata[] = [];

    // Traitement de chaque image avec sauvegarde en DB
    for (const file of files) {
      try {
        // Construction de l'URL d'accès
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? process.env.BASE_URL || 'http://localhost:3001'
          : 'http://localhost:3001';
        
        const imageUrl = `${baseUrl}/uploads/${file.filename}`;

        // ✅ SAUVEGARDER EN BASE DE DONNÉES MONGODB
        const imageDoc = new Image({
          userId,
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          format: path.extname(file.originalname).toLowerCase().replace('.', ''),
          mimetype: file.mimetype,
          url: imageUrl
        });
        
        await imageDoc.save();

        // Métadonnées pour la réponse
        const imageMetadata: ImageMetadata = {
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          format: path.extname(file.originalname).toLowerCase().replace('.', ''),
          url: imageUrl,
          mimetype: file.mimetype,
          uploadedAt: imageDoc.uploadedAt.toISOString()
        };

        console.log('🔍 Image sauvée en DB:', {
          filename: imageMetadata.filename,
          multerFilename: file.filename,
          originalname: imageMetadata.originalname,
          userId: userId
        });

        processedImages.push(imageMetadata);

        console.log(`✅ Image uploadée et sauvée: ${file.filename} (${Math.round(file.size/1024)}KB)`);

      } catch (imageError) {
        console.error('Erreur traitement image:', imageError);
        
        // Si la DB échoue, supprimer le fichier physique
        try {
          const filepath = path.join(process.cwd(), 'uploads', file.filename);
          await fs.unlink(filepath);
        } catch (cleanupError) {
          console.error('Erreur nettoyage fichier:', cleanupError);
        }
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

// ✅ CONTRÔLEUR DE SUPPRESSION CORRIGÉ
export const deleteImage = async (req: AuthenticatedRequest, res: Response) => {
  console.log('🗑️ DELETE appelé, filename:', req.params.filename);
  console.log('🗑️ User:', req.user?.email);
  
  try {
    const { filename } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      return sendError(res, 'Utilisateur non authentifié', 401);
    }

    console.log('🗑️ Recherche image avec:', {
      filename,
      userId: userId.toString(),
      userIdType: typeof userId
    });

    // ✅ CORRECTION 1: Recherche d'abord sans filtrer par deletedAt
    const baseQuery = { 
      filename: filename.trim(),
      userId: new mongoose.Types.ObjectId(userId.toString())
    };
    
    console.log('🔍 Query MongoDB base:', JSON.stringify(baseQuery, null, 2));
    
    const imageDoc = await Image.findOne(baseQuery);
    
    console.log('🔍 Résultat findOne:', !!imageDoc);
    
    if (!imageDoc) {
      console.log('❌ Image non trouvée dans la base');
      
      // Debug: chercher sans filtres pour diagnostic
      const allImages = await Image.find({ filename: filename.trim() });
      console.log('🔍 Images avec ce filename:', allImages.length);
      
      if (allImages.length > 0) {
        allImages.forEach((img, index) => {
          console.log(`🔍 Image ${index}:`, {
            userId: img.userId?.toString(),
            filename: img.filename,
            deletedAt: img.deletedAt,
            userIdMatch: img.userId?.toString() === userId.toString()
          });
        });
      }
      
      return sendError(res, 'Image non trouvée', 404);
    }

    // ✅ CORRECTION 2: Vérifier si l'image est déjà supprimée
    if (imageDoc.deletedAt) {
      console.log('⚠️ Image déjà supprimée le:', imageDoc.deletedAt);
      return res.status(410).json({
        success: false,
        message: 'Image déjà supprimée',
        data: {
          deletedAt: imageDoc.deletedAt,
          filename: filename
        }
      });
    }

    console.log('✅ Image trouvée et active:', {
      id: imageDoc._id,
      filename: imageDoc.filename,
      userId: imageDoc.userId.toString()
    });

    // ✅ CORRECTION 3: Soft delete avec mise à jour atomique
    const updatedImage = await Image.findOneAndUpdate(
      { 
        _id: imageDoc._id,
        deletedAt: null // Sécurité : s'assurer qu'elle n'est pas déjà supprimée
      },
      { 
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedImage) {
      console.log('❌ Échec du soft delete (race condition?)');
      return sendError(res, 'Erreur lors de la suppression (image déjà supprimée?)', 409);
    }
    
    console.log('✅ Soft delete effectué en DB');

    // ✅ CORRECTION 4: Suppression du fichier physique (optionnelle et non bloquante)
    try {
      const filepath = path.join(process.cwd(), 'uploads', filename);
      
      // Vérifier que le fichier existe avant de le supprimer
      try {
        await fs.access(filepath);
        await fs.unlink(filepath);
        console.log('✅ Fichier physique supprimé');
      } catch (fileError: any) {
        if (fileError.code === 'ENOENT') {
          console.log('ℹ️ Fichier physique déjà absent');
        } else {
          console.log('⚠️ Erreur suppression fichier physique:', fileError.message);
        }
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la gestion du fichier physique:', error);
      // Ne pas faire échouer la requête pour ça
    }
    
    return sendResponse(res, true, {
      message: 'Image supprimée avec succès',
      filename: filename,
      deletedAt: updatedImage.deletedAt
    }, 'Image supprimée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    return sendError(res, 'Erreur serveur lors de la suppression', 500);
  }
};

// ✅ AMÉLIORATION DU CONTRÔLEUR getUserImages
export const getUserImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    if (!userId) {
      return sendError(res, 'Utilisateur non authentifié', 401);
    }

    console.log('📋 GET images pour user:', req.user?.email, 'page:', page);

    // Query pour récupérer seulement les images non supprimées
    const query = { 
      userId: new mongoose.Types.ObjectId(userId.toString()),
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // Compter le total pour la pagination
    const total = await Image.countDocuments(query);

    // Récupérer les images avec pagination
    const images = await Image.find(query)
      .select('-__v') // Exclure le champ de version
      .sort({ uploadedAt: -1 }) // Plus récentes en premier
      .skip(skip)
      .limit(limit)
      .lean(); // Optimisation performance

    console.log(`📋 ${images.length} images trouvées (total: ${total})`);

    // Formater les métadonnées pour la réponse
    const imageMetadata = images.map(img => ({
      id: img._id,
      filename: img.filename,
      originalname: img.originalname,
      size: img.size,
      format: img.format,
      url: img.url,
      mimetype: img.mimetype,
      uploadedAt: img.uploadedAt,
      // Ajouter l'URL complète si nécessaire
      fullUrl: img.url.startsWith('http') ? img.url : `${req.protocol}://${req.get('host')}/uploads/${img.filename}`
    }));

    return sendResponse(res, true, {
      images: imageMetadata,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    }, 'Images récupérées avec succès');

  } catch (error) {
    console.error('Erreur récupération images utilisateur:', error);
    return sendError(res, 'Erreur lors de la récupération des images', 500);
  }
};

// Contrôleur pour obtenir des informations sur une image
export const getImageInfo = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // ✅ CHERCHER EN BASE DE DONNÉES D'ABORD
    const imageDoc = await Image.findOne({ filename, deletedAt: null });
    
    if (imageDoc) {
      const imageInfo = {
        filename: imageDoc.filename,
        originalname: imageDoc.originalname,
        size: imageDoc.size,
        format: imageDoc.format,
        mimetype: imageDoc.mimetype,
        url: imageDoc.url,
        uploadedAt: imageDoc.uploadedAt.toISOString()
      };

      return sendResponse(res, true, imageInfo, 'Informations de l\'image récupérées');
    }

    // Fallback : vérification fichier physique
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

// ✅ FONCTION DE NETTOYAGE AMÉLIORÉE
export const cleanupOldFiles = async (maxAgeHours: number = 24): Promise<void> => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Vérifier que le dossier existe
    if (!existsSync(uploadDir)) {
      console.log('📁 Dossier uploads n\'existe pas encore');
      return;
    }

    console.log('🧹 Début du nettoyage...');

    // 1. Nettoyer les fichiers orphelins (sur disque mais pas en DB)
    const files = readdirSync(uploadDir);
    let deletedOrphans = 0;

    for (const file of files) {
      try {
        // Chercher dans la DB (y compris les supprimés)
        const imageDoc = await Image.findOne({ filename: file });
        
        if (!imageDoc) {
          // Fichier orphelin - le supprimer
          const filepath = path.join(uploadDir, file);
          await fs.unlink(filepath);
          deletedOrphans++;
          console.log(`🗑️ Fichier orphelin supprimé: ${file}`);
        }
      } catch (error) {
        console.error(`❌ Erreur traitement fichier ${file}:`, error);
      }
    }

    // 2. Nettoyer les anciens enregistrements soft-deleted
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const oldDeletedImages = await Image.find({
      deletedAt: { $lt: cutoffDate, $ne: null }
    });

    let deletedOldRecords = 0;
    for (const imageDoc of oldDeletedImages) {
      try {
        // Supprimer le fichier physique s'il existe encore
        const filepath = path.join(uploadDir, imageDoc.filename);
        try {
          await fs.unlink(filepath);
        } catch (fileError: any) {
          if (fileError.code !== 'ENOENT') {
            console.log(`⚠️ Erreur suppression fichier ${imageDoc.filename}:`, fileError.message);
          }
        }
        
        // Supprimer définitivement de la DB
        await Image.findByIdAndDelete(imageDoc._id);
        deletedOldRecords++;
        console.log(`🗑️ Ancien record supprimé: ${imageDoc.filename}`);
      } catch (error) {
        console.error(`❌ Erreur suppression record ${imageDoc.filename}:`, error);
      }
    }

    console.log(`✅ Nettoyage terminé: ${deletedOrphans} orphelins, ${deletedOldRecords} anciens records`);
  } catch (error) {
    console.error('❌ Erreur nettoyage fichiers:', error);
  }
};