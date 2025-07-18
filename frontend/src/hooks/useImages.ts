import { useState, useCallback, useEffect } from 'react';
import { UploadedImage } from '../types/upload.types';
import { UploadService } from '../services/upload.service';

interface UseImagesState {
  images: UploadedImage[];
  loading: boolean;
  error: string | null;
  selectedImages: string[];
}

interface UseImagesReturn {
  state: UseImagesState;
  actions: {
    addImages: (images: UploadedImage[]) => void;
    removeImage: (filename: string) => Promise<boolean>;
    replaceImage: (oldFilename: string, newFile: File) => Promise<boolean>;
    selectImage: (filename: string) => void;
    unselectImage: (filename: string) => void;
    selectAllImages: () => void;
    unselectAllImages: () => void;
    clearImages: () => void;
    refreshImages: () => Promise<void>;
  };
  computed: {
    selectedCount: number;
    totalSize: number;
    hasImages: boolean;
    canUploadMore: (maxImages?: number) => boolean;
  };
}

export const useImages = (initialImages: UploadedImage[] = []): UseImagesReturn => {
  const [state, setState] = useState<UseImagesState>({
    images: initialImages,
    loading: false,
    error: null,
    selectedImages: []
  });

  // Sync avec les images initiales
  useEffect(() => {
    setState(prev => ({ ...prev, images: initialImages }));
  }, [initialImages]);

  // Actions
  const addImages = useCallback((newImages: UploadedImage[]) => {
    setState(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
      error: null
    }));
  }, []);

  const removeImage = useCallback(async (filename: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const success = await UploadService.deleteImage(filename);
      
      if (success) {
        setState(prev => ({
          ...prev,
          images: prev.images.filter(img => img.filename !== filename),
          selectedImages: prev.selectedImages.filter(f => f !== filename),
          loading: false
        }));
        return true;
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      }));
      return false;
    }
  }, []);

  const replaceImage = useCallback(async (oldFilename: string, newFile: File): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Supprimer l'ancienne image
      await UploadService.deleteImage(oldFilename);
      
      // Upload la nouvelle
      const newImages = await UploadService.uploadImages([newFile]);
      
      setState(prev => ({
        ...prev,
        images: prev.images.map(img => 
          img.filename === oldFilename ? newImages[0] : img
        ),
        loading: false
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du remplacement'
      }));
      return false;
    }
  }, []);

  const selectImage = useCallback((filename: string) => {
    setState(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.includes(filename) 
        ? prev.selectedImages 
        : [...prev.selectedImages, filename]
    }));
  }, []);

  const unselectImage = useCallback((filename: string) => {
    setState(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.filter(f => f !== filename)
    }));
  }, []);

  const selectAllImages = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedImages: prev.images.map(img => img.filename)
    }));
  }, []);

  const unselectAllImages = useCallback(() => {
    setState(prev => ({ ...prev, selectedImages: [] }));
  }, []);

  const clearImages = useCallback(() => {
    setState(prev => ({
      ...prev,
      images: [],
      selectedImages: [],
      error: null
    }));
  }, []);

  const refreshImages = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Rafraîchir les infos de chaque image
      const refreshedImages = await Promise.all(
        state.images.map(async (img) => {
          try {
            return await UploadService.getImageInfo(img.filename);
          } catch (error) {
            console.warn(`Impossible de rafraîchir l'image ${img.filename}:`, error);
            return img; // Garder l'ancienne version
          }
        })
      );
      
      setState(prev => ({
        ...prev,
        images: refreshedImages,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du rafraîchissement'
      }));
    }
  }, [state.images]);

  // Computed values
  const computed = {
    selectedCount: state.selectedImages.length,
    totalSize: state.images.reduce((total, img) => total + img.size, 0),
    hasImages: state.images.length > 0,
    canUploadMore: (maxImages = 5) => state.images.length < maxImages
  };

  return {
    state,
    actions: {
      addImages,
      removeImage,
      replaceImage,
      selectImage,
      unselectImage,
      selectAllImages,
      unselectAllImages,
      clearImages,
      refreshImages
    },
    computed
  };
};