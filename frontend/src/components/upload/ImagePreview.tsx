import React, { useState } from 'react';
import { X, Eye, Download, Share2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { UploadedImage } from '../../types/upload.types';
import { UploadService } from '../../services/upload.service';

interface ImagePreviewProps {
  image: UploadedImage;
  onRemove?: (filename: string) => void;
  onReplace?: (filename: string) => void;
  showActions?: boolean;
  className?: string;
}

interface ImageModalProps {
  image: UploadedImage;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.originalname;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.originalname,
          url: image.url
        });
      } catch (error) {
        console.error('Erreur partage:', error);
        // Fallback : copier l'URL
        navigator.clipboard.writeText(image.url);
        alert('URL copiée dans le presse-papiers');
      }
    } else {
      // Fallback : copier l'URL
      navigator.clipboard.writeText(image.url);
      alert('URL copiée dans le presse-papiers');
    }
  };

  const resetTransforms = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      {/* Header avec controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-white">
          <h3 className="text-lg font-medium truncate max-w-md">
            {image.originalname}
          </h3>
          <span className="text-sm text-gray-300">
            ({UploadService.formatFileSize(image.size)})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            disabled={zoom <= 25}
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-[3rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(300, zoom + 25))}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            disabled={zoom >= 300}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          {/* Rotation */}
          <button
            onClick={() => setRotation((rotation + 90) % 360)}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          {/* Reset */}
          <button
            onClick={resetTransforms}
            className="px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors text-sm"
          >
            Reset
          </button>
          
          {/* Actions */}
          <button
            onClick={handleDownload}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleShare}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          
          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex items-center justify-center w-full h-full pt-20 pb-4">
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

      {/* Footer info */}
      <div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm">
        <p>
          Format: {image.format.toUpperCase()} • 
          Uploadé le {new Date(image.uploadedAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onRemove,
  onReplace,
  showActions = true,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      setIsLoading(true);
      try {
        await UploadService.deleteImage(image.filename);
        onRemove?.(image.filename);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression de l\'image');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReplace = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onReplace?.(image.filename);
      }
    };
    input.click();
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <img
            src={image.url}
            alt={image.originalname}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        {/* Overlay avec actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity duration-200">
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
                title="Voir en grand"
              >
                <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>

              {onReplace && (
                <button
                  onClick={handleReplace}
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
                  title="Remplacer"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                </button>
              )}

              {onRemove && (
                <button
                  onClick={handleRemove}
                  disabled={isLoading}
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Supprimer"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Info en bas */}
        <div className="mt-2">
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {image.originalname}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {UploadService.formatFileSize(image.size)} • {image.format.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Modal */}
      <ImageModal
        image={image}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};