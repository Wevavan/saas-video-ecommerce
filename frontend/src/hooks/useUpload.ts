import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { UploadService } from '../services/upload.service';

// Types pour l'upload
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

export interface UploadState {
  uploading: boolean;
  progress: UploadProgress | null;
  success: boolean;
  error: string | null;
  uploadedImages: UploadedImage[];
}

export interface UseUploadReturn {
  uploadState: UploadState;
  uploadImages: (files: File[]) => Promise<UploadedImage[] | null>;
  resetUpload: () => void;
  removeImage: (filename: string) => Promise<boolean>;
  retryUpload: () => Promise<UploadedImage[] | null>;
}

export const useUpload = (): UseUploadReturn => {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: null,
    success: false,
    error: null,
    uploadedImages: []
  });
  const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Essayer différents formats de token
        return parsed.token || parsed.data?.token || parsed.accessToken;
      } catch (e) {
        console.error('Erreur parsing auth data:', e);
      }
    }

  // État pour retry
  const [lastFiles, setLastFiles] = useState<File[]>([]);

  // Fonction principale d'upload utilisant UploadService
  const uploadImages = useCallback(async (files: File[]): Promise<UploadedImage[] | null> => {
    if (!user) {
      setUploadState(prev => ({ ...prev, error: 'Utilisateur non authentifié' }));
      return null;
    }

    // Validation côté client
    const validation = UploadService.validateFiles(files);
    if (!validation.valid) {
      setUploadState(prev => ({ ...prev, error: validation.error || 'Erreur de validation' }));
      return null;
    }

    // Sauvegarder les fichiers pour retry
    setLastFiles(files);

    // Reset état et démarrage upload
    setUploadState({
      uploading: true,
      progress: { loaded: 0, total: 100, percentage: 0 },
      success: false,
      error: null,
      uploadedImages: []
    });

    try {
      // Utiliser UploadService avec callback progress
      const uploadedImages = await UploadService.uploadImages(files, (progress) => {
        setUploadState(prev => ({
          ...prev,
          progress
        }));
      });

      // Success
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: { loaded: 100, total: 100, percentage: 100 },
        success: true,
        error: null,
        uploadedImages
      }));

      return uploadedImages;

    } catch (error) {
      console.error('Erreur upload:', error);
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: null,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload',
        uploadedImages: []
      }));

      return null;
    }
  }, [user]);

  // Reset de l'état
  const resetUpload = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: null,
      success: false,
      error: null,
      uploadedImages: []
    });
    setLastFiles([]);
  }, []);

  // Suppression d'une image utilisant UploadService
  const removeImage = useCallback(async (filename: string): Promise<boolean> => {
    try {
      const success = await UploadService.deleteImage(filename);
      
      if (success) {
        // Retirer l'image de la liste locale
        setUploadState(prev => ({
          ...prev,
          uploadedImages: prev.uploadedImages.filter(img => img.filename !== filename)
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Erreur suppression:', error);
      return false;
    }
  }, []);

  // Retry avec les derniers fichiers
  const retryUpload = useCallback(async (): Promise<UploadedImage[] | null> => {
    if (lastFiles.length === 0) {
      setUploadState(prev => ({ ...prev, error: 'Aucun fichier à retenter' }));
      return null;
    }
    return uploadImages(lastFiles);
  }, [lastFiles, uploadImages]);

  return {
    uploadState,
    uploadImages,
    resetUpload,
    removeImage,
    retryUpload
  };
};