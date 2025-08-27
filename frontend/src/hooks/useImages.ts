// frontend/src/hooks/useImages.ts - VERSION CORRIGÉE

import { useState, useEffect, useCallback } from 'react';
import { UploadService } from '../services/upload.service';
import { UploadedImage } from '../types/upload.types';

interface UseImagesState {
  images: UploadedImage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface UseImagesReturn extends UseImagesState {
  refreshImages: () => Promise<void>;
  loadMoreImages: () => Promise<void>;
  removeImageFromList: (filename: string) => void;
  addImagesToList: (newImages: UploadedImage[]) => void;
}

export const useImages = (pageSize: number = 20): UseImagesReturn => {
  const [state, setState] = useState<UseImagesState>({
    images: [],
    loading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fonction pour charger les images
  const loadImages = useCallback(async (page: number = 1, append: boolean = false) => {
    console.log('📋 Chargement images page:', page, 'append:', append);
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await UploadService.getUserImages(page, pageSize);
      
      console.log('✅ Images reçues:', response);

      setState(prev => ({
        ...prev,
        images: append ? [...prev.images, ...response.images] : response.images,
        loading: false,
        currentPage: response.pagination?.currentPage || page,
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.totalItems || response.images.length,
        hasMore: response.pagination?.hasNextPage || false,
        error: null
      }));

    } catch (error) {
      console.error('❌ Erreur chargement images:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des images'
      }));
    }
  }, [pageSize]);

  // Charger les images au montage du composant
  useEffect(() => {
    loadImages(1, false);
  }, [loadImages]);

  // Fonction pour rafraîchir les images
  const refreshImages = useCallback(async () => {
    await loadImages(1, false);
  }, [loadImages]);

  // Fonction pour charger plus d'images
  const loadMoreImages = useCallback(async () => {
    if (!state.loading && state.hasMore) {
      await loadImages(state.currentPage + 1, true);
    }
  }, [loadImages, state.loading, state.hasMore, state.currentPage]);

  // Fonction pour retirer une image de la liste locale
  const removeImageFromList = useCallback((filename: string) => {
    console.log('🗑️ Suppression locale de l\'image:', filename);
    
    setState(prev => ({
      ...prev,
      images: prev.images.filter(img => img.filename !== filename),
      totalItems: Math.max(0, prev.totalItems - 1)
    }));
  }, []);

  // Fonction pour ajouter des images à la liste locale
  const addImagesToList = useCallback((newImages: UploadedImage[]) => {
    console.log('➕ Ajout local d\'images:', newImages.length);
    
    setState(prev => ({
      ...prev,
      images: [
        ...newImages, // Nouvelles images en premier
        ...prev.images.filter(existingImg => 
          !newImages.some(newImg => newImg.filename === existingImg.filename)
        )
      ],
      totalItems: prev.totalItems + newImages.length
    }));
  }, []);

  return {
    ...state,
    refreshImages,
    loadMoreImages,
    removeImageFromList,
    addImagesToList
  };
};