import { z } from 'zod'

// Schémas d'authentification
export const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
})

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
})

// Schémas utilisateur
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional()
})

// Schémas vidéo
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

// Schémas de génération
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

// Schémas de paramètres
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


// Schémas pour les routes de test
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