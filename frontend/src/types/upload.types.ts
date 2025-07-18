// Types pour l'upload côté frontend

export interface UploadedImage {
  filename: string;
  originalname: string;
  size: number;
  format: string;
  url: string;
  mimetype: string;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    images: UploadedImage[];
    total: number;
  };
}

export interface UploadError {
  success: false;
  message: string;
}

// Configuration de validation côté client
export const UPLOAD_VALIDATION = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 5,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
} as const;

export type SupportedImageType = typeof UPLOAD_VALIDATION.allowedTypes[number];
export type SupportedImageExtension = typeof UPLOAD_VALIDATION.allowedExtensions[number];