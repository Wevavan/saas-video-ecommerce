// frontend/src/hooks/useUpload.ts

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { UploadedImage } from '../types/upload.types';

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useUpload = (): UseUploadReturn => {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: null,
    success: false,
    error: null,
    uploadedImages: []
  });
  const [lastUploadedFiles, setLastUploadedFiles] = useState<File[]>([]);

  // Fonction pour récupérer le token d'auth
  const getAuthToken = useCallback((): string | null => {
    let token = localStorage.getItem('accessToken') || 
                localStorage.getItem('authToken') ||
                sessionStorage.getItem('accessToken') ||
                sessionStorage.getItem('authToken');
    
    if (!token) {
      const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          token = parsed.token || parsed.data?.token || parsed.accessToken;
        } catch (e) {
          console.error('Erreur parsing auth data:', e);
        }
      }
    }
    
    return token;
  }, []);

  // Validation des fichiers
  const validateFiles = (files: File[]): { valid: boolean; error?: string } => {
    if (!files || files.length === 0) {
      return { valid: false, error: 'Aucun fichier sélectionné' };
    }

    if (files.length > 5) {
      return { valid: false, error: 'Maximum 5 fichiers autorisés' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return { 
          valid: false, 
          error: `Format non supporté: ${file.type}. Utilisez JPG, PNG ou WebP.` 
        };
      }

      if (file.size > maxSize) {
        return { 
          valid: false, 
          error: `Fichier trop volumineux: ${file.name}. Maximum 5MB.` 
        };
      }
    }

    return { valid: true };
  };

  // Fonction principale d'upload
  const uploadImages = useCallback(async (files: File[]): Promise<UploadedImage[] | null> => {
    console.log('📤 Début upload de', files.length, 'fichier(s)');
    
    if (!user) {
      setUploadState(prev => ({ ...prev, error: 'Utilisateur non authentifié' }));
      return null;
    }

    const token = getAuthToken();
    if (!token) {
      setUploadState(prev => ({ ...prev, error: 'Token d\'authentification manquant' }));
      return null;
    }

    // Validation côté client
    const validation = validateFiles(files);
    if (!validation.valid) {
      setUploadState(prev => ({ ...prev, error: validation.error || 'Erreur de validation' }));
      return null;
    }

    // Sauvegarder les fichiers pour retry
    setLastUploadedFiles(files);

    // Reset état et démarrage upload
    setUploadState({
      uploading: true,
      progress: { loaded: 0, total: 100, percentage: 0 },
      success: false,
      error: null,
      uploadedImages: []
    });

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // Upload avec XMLHttpRequest pour le progress
      const uploadedImages = await new Promise<UploadedImage[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Gestion de la progression
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setUploadState(prev => ({
              ...prev,
              progress: {
                loaded: event.loaded,
                total: event.total,
                percentage
              }
            }));
          }
        });

        // Gestion de la réponse
        xhr.addEventListener('load', () => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data?.images) {
                console.log('✅ Upload réussi:', response.data.images);
                resolve(response.data.images);
              } else {
                throw new Error(response.message || 'Erreur lors de l\'upload');
              }
            } else {
              let errorMessage = `Erreur ${xhr.status}`;
              try {
                const errorData = JSON.parse(xhr.responseText);
                errorMessage = errorData.message || errorMessage;
              } catch {
                errorMessage = xhr.statusText || errorMessage;
              }
              throw new Error(errorMessage);
            }
          } catch (error) {
            console.error('❌ Erreur parsing réponse:', error);
            reject(error);
          }
        });

        // Gestion des erreurs réseau
        xhr.addEventListener('error', () => {
          reject(new Error('Erreur réseau lors de l\'upload'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Timeout lors de l\'upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload annulé'));
        });

        // Configuration de la requête
        xhr.open('POST', `${API_BASE_URL}/upload/images`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.timeout = 120000; // 2 minutes timeout

        // Envoi de la requête
        xhr.send(formData);
      });

      // Succès
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
      console.error('❌ Erreur upload:', error);
      
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
  }, [user, getAuthToken]);

  // Fonction de suppression d'image
  const removeImage = useCallback(async (filename: string): Promise<boolean> => {
    console.log('🗑️ Suppression image:', filename);
    
    const token = getAuthToken();
    if (!token) {
      setUploadState(prev => ({ ...prev, error: 'Token d\'authentification manquant' }));
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload/image/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok || response.status === 410) {
        console.log('✅ Image supprimée avec succès');
        setUploadState(prev => ({
          ...prev,
          uploadedImages: prev.uploadedImages.filter(img => img.filename !== filename),
          error: null
        }));
        return true;
      }

      throw new Error('Erreur lors de la suppression');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      setUploadState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      }));
      return false;
    }
  }, [getAuthToken]);

  // Fonction de retry
  const retryUpload = useCallback(async (): Promise<UploadedImage[] | null> => {
    if (lastUploadedFiles.length === 0) {
      setUploadState(prev => ({ ...prev, error: 'Aucun fichier à réessayer' }));
      return null;
    }

    console.log('🔄 Retry upload de', lastUploadedFiles.length, 'fichier(s)');
    return uploadImages(lastUploadedFiles);
  }, [lastUploadedFiles, uploadImages]);

  // Fonction de reset
  const resetUpload = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: null,
      success: false,
      error: null,
      uploadedImages: []
    });
    setLastUploadedFiles([]);
  }, []);

  return {
    uploadState,
    uploadImages,
    resetUpload,
    removeImage,
    retryUpload
  };
};