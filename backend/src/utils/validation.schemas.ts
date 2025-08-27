// backend/src/utils/validation.schemas.ts - VERSION COMPLÈTE MISE À JOUR
import { z } from 'zod'

// ✅ TES SCHÉMAS EXISTANTS (gardés à l'identique)
export const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
})

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional()
})

export const createVideoSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  template: z.string().optional(),
  settings: z.record(z.any()).optional()
})

export const updateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['processing', 'completed', 'failed']).optional(),
  url: z.string().url().optional()
})

// ✅ TON SCHÉMA EXISTANT (renommé pour éviter les conflits)
export const generateVideoSchema = z.object({
  templateId: z.string().min(1, 'ID du template requis'),
  productData: z.object({
    name: z.string().min(1, 'Nom du produit requis'),
    price: z.number().positive('Prix invalide'),
    images: z.array(z.string().url()).min(1, 'Au moins une image requise'),
    description: z.string().optional()
  }),
  settings: z.record(z.any()).optional()
})

// 🆕 NOUVEAU SCHÉMA: Génération vidéo IA
export const generateAiVideoSchema = z.object({
  imageUrl: z.string().url('URL d\'image invalide'),
  productInfo: z.object({
    name: z.string().min(1, 'Nom produit requis').max(100, 'Nom trop long'),
    description: z.string().min(1, 'Description requise').max(500, 'Description trop longue'),
    price: z.number().positive('Prix doit être positif'),
    category: z.string().min(1, 'Catégorie requise'),
    targetAudience: z.string().min(1, 'Public cible requis'),
  }),
  style: z.enum(['moderne', 'luxe', 'jeune', 'professionnel', 'b2b'], {
    errorMap: () => ({ message: 'Style doit être: moderne, luxe, jeune, professionnel ou b2b' })
  }),
  voiceSettings: z.object({
    voiceId: z.string().min(1, 'ID voix requis'),
    speed: z.number().min(0.5).max(2, 'Vitesse entre 0.5 et 2'),
    pitch: z.number().min(-20).max(20, 'Pitch entre -20 et 20'),
  }),
  duration: z.number().min(10, 'Durée minimum 10s').max(60, 'Durée maximum 60s'),
});

// ✅ TES SCHÉMAS EXISTANTS (gardés à l'identique)
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID requis')
})

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

export const createTestUserSchema = z.object({
  name: z.string().min(2, 'Nom minimum 2 caractères').max(100, 'Nom maximum 100 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  credits: z.number().min(0).max(10000).optional()
})

export const listUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  search: z.string().min(1).optional()
})