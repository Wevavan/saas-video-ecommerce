// frontend/src/components/upload/ImageUpload.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  FileImage,
  Trash2,
  Eye,
  ZoomIn,
  RotateCcw,
  Download,
  AlertTriangle
} from 'lucide-react';
import { useUpload } from '../../hooks/useUpload';
import { UploadedImage } from '../../types/upload.types';

interface ImageUploadProps {
  onImagesUploaded?: (images: UploadedImage[]) => void;
  onImageRemoved?: (filename: string) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // en MB
  acceptedFormats?: string[];
  showPreview?: boolean;
  showGallery?: boolean;
  initialImages?: UploadedImage[];
  className?: string;
}

interface FileWithPreview {
  file: File;
  id: string;
  preview: string;
  error?: string;
  uploaded?: boolean;
}

interface ImageModalProps {
  image: UploadedImage | null;
  isOpen: boolean;
  onClose: () => void;
}

// Modal de preview d'image
const ImageModal: React.FC<ImageModalProps> = ({ image, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !image) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.originalname;
    link.click();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full">
        {/* Header avec contrôles */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3 text-white">
            <h3 className="text-lg font-medium truncate">{image.originalname}</h3>
            <span className="text-sm text-gray-300">
              ({(image.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(Math.max(25, zoom - 25));
              }}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
              title="Zoom arrière"
            >
              <ZoomIn className="w-5 h-5 transform rotate-180" />
            </button>
            
            <span className="text-white text-sm min-w-[3rem] text-center">
              {zoom}%
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(Math.min(200, zoom + 25));
              }}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
              title="Zoom avant"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRotation((rotation + 90) % 360);
              }}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
              title="Rotation"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(100);
                setRotation(0);
              }}
              className="px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 text-sm"
              title="Reset"
            >
              Reset
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div 
          className="flex items-center justify-center min-h-[60vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={image.url}
            alt={image.originalname}
            className="max-w-full max-h-full object-contain transition-all duration-300"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesUploaded,
  onImageRemoved,
  maxFiles = 5,
  maxSizePerFile = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  showPreview = true,
  showGallery = false,
  initialImages = [],
  className = ''
}) => {
  const { uploadState, uploadImages, resetUpload, removeImage, retryUpload } = useUpload();
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [modalImage, setModalImage] = useState<UploadedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer un ID unique pour chaque fichier
  const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Validation d'un fichier
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Format non supporté. Utilisez: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }

    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `Fichier trop volumineux. Maximum: ${maxSizePerFile}MB`;
    }

    return null;
  }, [acceptedFormats, maxSizePerFile]);

  // Traitement des fichiers sélectionnés
  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Vérifier le nombre total de fichiers
    const totalFiles = selectedFiles.length + uploadState.uploadedImages.length + initialImages.length + fileArray.length;
    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} fichier(s) autorisé(s) au total`);
      return;
    }

    const newFiles: FileWithPreview[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      const id = generateFileId();
      
      try {
        const preview = URL.createObjectURL(file);
        newFiles.push({
          file,
          id,
          preview,
          error: error || undefined,
          uploaded: false
        });
      } catch (err) {
        console.error('Erreur création preview:', err);
        newFiles.push({
          file,
          id,
          preview: '',
          error: 'Erreur lors de la création de l\'aperçu',
          uploaded: false
        });
      }
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, [selectedFiles.length, uploadState.uploadedImages.length, initialImages.length, maxFiles, validateFile]);

  // Gestionnaire de sélection de fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gestionnaires drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Supprimer un fichier sélectionné
  const removeSelectedFile = (id: string) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  // Upload des fichiers
  const handleUpload = async () => {
    const validFiles = selectedFiles.filter(f => !f.error).map(f => f.file);
    
    if (validFiles.length === 0) {
      alert('Aucun fichier valide à uploader');
      return;
    }

    try {
      const uploadedImages = await uploadImages(validFiles);
      
      if (uploadedImages) {
        // Nettoyer les aperçus
        selectedFiles.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        setSelectedFiles([]);
        
        // Notifier le parent
        onImagesUploaded?.(uploadedImages);
      }
    } catch (error) {
      console.error('Erreur upload:', error);
    }
  };

  // Supprimer une image uploadée
  const handleRemoveUploaded = async (filename: string) => {
    try {
      const success = await removeImage(filename);
      if (success) {
        onImageRemoved?.(filename);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  // Reset complet
  const handleReset = () => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    resetUpload();
  };

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const hasValidFiles = selectedFiles.some(f => !f.error);
  const hasErrors = selectedFiles.some(f => f.error);
  const totalImages = selectedFiles.length + uploadState.uploadedImages.length + initialImages.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Zone de drop principale */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
            : uploadState.uploading
            ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500'
        } ${uploadState.uploading ? 'pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploadState.uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          disabled={uploadState.uploading}
          className="hidden"
        />

        {uploadState.uploading ? (
          // État upload en cours
          <div className="space-y-4">
            <div className="relative">
              <RefreshCw className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full opacity-20"></div>
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload en cours...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ne fermez pas cette page
              </p>
              {uploadState.progress && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progression</span>
                    <span>{uploadState.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${uploadState.progress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(uploadState.progress.loaded / 1024 / 1024).toFixed(1)} MB / {(uploadState.progress.total / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // État normal
          <div className="space-y-4">
            <div className="relative">
              <Upload className="w-16 h-16 mx-auto text-gray-400" />
              {dragActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-blue-500 border-dashed rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {dragActive ? 'Déposez vos images ici' : 'Sélectionnez ou déposez vos images'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Maximum {maxFiles} fichier(s) • {maxSizePerFile}MB max par fichier
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Formats supportés: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
              </p>
              <div className="text-xs text-gray-500 mt-2">
                {totalImages}/{maxFiles} fichier(s) au total
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages d'état */}
      {uploadState.error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-300">{uploadState.error}</p>
            <button
              onClick={retryUpload}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {uploadState.success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-300">
            {uploadState.uploadedImages.length} image(s) uploadée(s) avec succès !
          </p>
        </div>
      )}

      {/* Preview des fichiers sélectionnés */}
      {selectedFiles.length > 0 && showPreview && (
                  <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fichiers sélectionnés ({selectedFiles.length})
            </h3>
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Tout effacer
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((fileItem) => (
              <div key={fileItem.id} className="relative group">
                <div className={`aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-all ${
                  fileItem.error ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-transparent'
                }`}>
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status overlay */}
                  {fileItem.uploaded && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Bouton de suppression */}
                <button
                  onClick={() => removeSelectedFile(fileItem.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Retirer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Info fichier */}
                <div className="mt-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={fileItem.file.name}>
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {fileItem.error && (
                    <div className="mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <p className="text-xs text-red-500">{fileItem.error}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {hasErrors && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{selectedFiles.filter(f => f.error).length} fichier(s) avec erreur(s)</span>
                </div>
              )}
              {!hasErrors && hasValidFiles && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{selectedFiles.filter(f => !f.error).length} fichier(s) prêt(s)</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!hasValidFiles || uploadState.uploading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {uploadState.uploading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Upload...</span>
                  </div>
                ) : (
                  `Uploader (${selectedFiles.filter(f => !f.error).length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Galerie des images existantes */}
      {showGallery && initialImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Images existantes ({initialImages.length})
            </h3>
            <div className="text-sm text-gray-500">
              Cliquez sur une image pour l'agrandir
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {initialImages.map((image) => (
              <div key={image.filename} className="relative group">
                <div 
                  className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all duration-200 transform hover:scale-105"
                  onClick={() => setModalImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.originalname}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Badge format */}
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black bg-opacity-60 text-white text-xs rounded">
                    {image.format.toUpperCase()}
                  </div>
                </div>

                {/* Bouton de suppression */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Supprimer "${image.originalname}" ?`)) {
                      onImageRemoved?.(image.filename);
                    }
                  }}
                  className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                {/* Info image */}
                <div className="mt-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={image.originalname}>
                    {image.originalname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Modal de preview */}
      <ImageModal
        image={modalImage}
        isOpen={modalImage !== null}
        onClose={() => setModalImage(null)}
      />
    </div>
  );
};