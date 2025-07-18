// Types pour le système d'upload

export interface ImageMetadata {
  filename: string;
  originalname: string;
  size: number;
  width: number;
  height: number;
  format: string;
  url: string;
  mimetype: string;
  createdAt?: Date;
}

export interface UploadResponse {
  message: string;
  images: ImageMetadata[];
  total: number;
}

export interface UploadError {
  error: string;
  code?: string;
  details?: string;
}

export interface FileValidationOptions {
  maxFileSize: number;
  allowedMimeTypes: string[];
  maxFiles: number;
}

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  progressive: boolean;
}

export interface StorageConfig {
  uploadDir: string;
  baseUrl: string;
  cleanup: {
    enabled: boolean;
    maxAgeHours: number;
  };
}

// Constantes pour la configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  COMPRESSION: {
    MAX_WIDTH: 2048,
    MAX_HEIGHT: 2048,
    QUALITY: 85,
    PROGRESSIVE: true
  },
  CLEANUP: {
    MAX_AGE_HOURS: 24 // Nettoyage des fichiers de plus de 24h
  }
} as const;

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp';
export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';