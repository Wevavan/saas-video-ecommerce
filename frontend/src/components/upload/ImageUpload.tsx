import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, RefreshCw, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useUpload, UploadedImage } from '../../hooks/useUpload';
import { useImages } from '../../hooks/useImages';
import { ImageGallery } from './ImageGallery';

interface ImageUploadProps {
  onImagesUploaded?: (images: UploadedImage[]) => void;
  maxFiles?: number;
  className?: string;
  initialImages?: UploadedImage[];
  showGallery?: boolean;
}

interface PreviewImage {
  file: File;
  preview: string;
  id: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesUploaded,
  maxFiles = 5,
  className = '',
  initialImages = [],
  showGallery = true
}) => {
  const { uploadState, uploadImages, resetUpload, retryUpload } = useUpload();
  const { state: imagesState, actions: imageActions, computed } = useImages(initialImages);
  
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Création des previews
  const createPreviews = useCallback((files: File[]): PreviewImage[] => {
    return files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
  }, []);

  // Nettoyage des previews
  const cleanupPreviews = useCallback((previews: PreviewImage[]) => {
    previews.forEach(preview => {
      URL.revokeObjectURL(preview.preview);
    });
  }, []);

  // Gestion des fichiers sélectionnés
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validation nombre de fichiers avec les images existantes
    const totalFiles = imagesState.images.length + fileArray.length;
    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} fichiers autorisés (vous en avez déjà ${imagesState.images.length})`);
      return;
    }

    // Créer les previews
    const newPreviews = createPreviews(fileArray);
    setPreviewImages(newPreviews);

    // Lancer l'upload
    const result = await uploadImages(fileArray);
    
    if (result) {
      // Ajouter les nouvelles images au state
      imageActions.addImages(result);
      
      // Callback externe
      if (onImagesUploaded) {
        onImagesUploaded(result);
      }
      
      // Nettoyer les previews
      cleanupPreviews(newPreviews);
      setPreviewImages([]);
    }
  }, [maxFiles, imagesState.images.length, createPreviews, uploadImages, imageActions, onImagesUploaded, cleanupPreviews]);

  // Events drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Click sur input file
  const handleInputClick = useCallback(() => {
    if (!computed.canUploadMore(maxFiles)) {
      alert(`Vous avez déjà atteint la limite de ${maxFiles} images`);
      return;
    }
    fileInputRef.current?.click();
  }, [computed, maxFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // Reset complet
  const handleReset = useCallback(() => {
    cleanupPreviews(previewImages);
    setPreviewImages([]);
    resetUpload();
    imageActions.clearImages();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewImages, cleanupPreviews, resetUpload, imageActions]);

  // Retry upload
  const handleRetry = useCallback(async () => {
    const result = await retryUpload();
    if (result) {
      imageActions.addImages(result);
      if (onImagesUploaded) {
        onImagesUploaded(result);
      }
    }
  }, [retryUpload, imageActions, onImagesUploaded]);

  // Formatage taille fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const canUpload = computed.canUploadMore(maxFiles);

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Zone de drop principale */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : canUpload
            ? 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
            : 'border-gray-200 dark:border-gray-700 opacity-50'
          }
          ${uploadState.uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={canUpload ? handleInputClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {uploadState.uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Upload en cours...
              </p>
              {uploadState.progress && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {uploadState.progress.percentage}% - {formatFileSize(uploadState.progress.loaded)} / {formatFileSize(uploadState.progress.total)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : uploadState.success ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-green-900 dark:text-green-100">
                Upload réussi !
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {uploadState.uploadedImages.length} image(s) uploadée(s)
              </p>
            </div>
            {canUpload && (
              <button
                onClick={handleInputClick}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Uploader d'autres images
              </button>
            )}
          </div>
        ) : uploadState.error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-red-900 dark:text-red-100">
                Erreur d'upload
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {uploadState.error}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
              <button
                onClick={() => {
                  resetUpload();
                  setPreviewImages([]);
                }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Recommencer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {canUpload ? 'Glissez vos images ici' : 'Limite atteinte'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {canUpload 
                  ? `ou cliquez pour sélectionner (${maxFiles - imagesState.images.length} restants, 5MB max)`
                  : `Vous avez atteint la limite de ${maxFiles} images`
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Formats supportés : JPG, PNG, WebP
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Previews des images sélectionnées (avant upload) */}
      {previewImages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Images en cours d'upload ({previewImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {previewImages.map((preview) => (
              <div key={preview.id} className="relative">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={preview.preview}
                    alt={preview.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatFileSize(preview.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Galerie des images uploadées */}
      {showGallery && computed.hasImages && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Images uploadées ({imagesState.images.length})
            </h3>
            {imagesState.images.length > 0 && (
              <button
                onClick={handleReset}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Tout supprimer
              </button>
            )}
          </div>
          
          <ImageGallery
            images={imagesState.images}
            selectedImages={imagesState.selectedImages}
            onImageSelect={imageActions.selectImage}
            onImageUnselect={imageActions.unselectImage}
            onImageRemove={imageActions.removeImage}
            onSelectAll={imageActions.selectAllImages}
            onUnselectAll={imageActions.unselectAllImages}
            loading={imagesState.loading}
          />
          
          {imagesState.error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {imagesState.error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal zoom image */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={zoomedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};