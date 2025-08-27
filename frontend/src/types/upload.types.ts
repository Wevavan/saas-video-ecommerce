// frontend/src/types/upload.types.ts

export interface UploadedImage {
  id?: string;
  filename: string;
  originalname: string;
  size: number;
  format: string;
  url: string;
  fullUrl?: string;
  mimetype: string;
  uploadedAt: string;
  deletedAt?: string | null;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadState {
  uploading: boolean;
  progress: UploadProgress | null;
  success: boolean;
  error: string | null;
  uploadedImages: UploadedImage[];
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    images: UploadedImage[];
    total: number;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface ImageValidation {
  valid: boolean;
  error?: string;
}

export interface DeleteImageResponse {
  success: boolean;
  message?: string;
  data?: {
    filename: string;
    deletedAt?: string;
  };
}

export interface FileWithPreview {
  file: File;
  id: string;
  preview: string;
  error?: string;
  uploaded?: boolean;
}

export interface UploadConfig {
  maxFiles: number;
  maxSizePerFile: number; // en MB
  acceptedFormats: string[];
  apiUrl: string;
  retryAttempts: number;
  retryDelay: number; // en ms
}