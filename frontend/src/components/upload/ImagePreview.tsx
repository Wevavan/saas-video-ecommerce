// frontend/src/components/upload/ImagePreview.tsx - CORRECTION FINALE

import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  Download, 
  Share2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Info,
  Calendar,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Hash,
  Link
} from 'lucide-react';
import { UploadedImage } from '../../types/upload.types';
import { UploadService } from '../../services/upload.service';

interface ImagePreviewProps {
  image: UploadedImage;
  onRemove?: (filename: string) => void;
  onReplace?: (filename: string) => void;
  showActions?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
  const [showInfo, setShowInfo] = useState(false);

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
        try {
          await navigator.clipboard.writeText(image.url);
          alert('URL copiée dans le presse-papiers');
        } catch (clipboardError) {
          console.error('Erreur copie clipboard:', clipboardError);
          alert('Impossible de copier l\'URL');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(image.url);
        alert('URL copiée dans le presse-papiers');
      } catch (error) {
        console.error('Erreur copie clipboard:', error);
        alert('Impossible de copier l\'URL');
      }
    }
  };

  const resetTransforms = () => {
    setZoom(100);
    setRotation(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  const uploadDate = formatDate(image.uploadedAt);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'i' || e.key === 'I') {
        setShowInfo(!showInfo);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, showInfo]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex"
      onClick={onClose}
    >
      {/* Header avec controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-3 text-white">
          <h3 className="text-lg font-medium truncate max-w-md">
            {image.originalname}
          </h3>
          <span className="text-sm text-gray-300">
            ({UploadService.formatFileSize(image.size)})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            className={`p-2 rounded-lg transition-colors ${
              showInfo 
                ? 'bg-blue-600 text-white' 
                : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
            }`}
            title="Informations (I)"
          >
            <Info className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom(Math.max(25, zoom - 25));
            }}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            disabled={zoom <= 25}
            title="Zoom arrière"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-[3rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom(Math.min(300, zoom + 25));
            }}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            disabled={zoom >= 300}
            title="Zoom avant"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRotation((rotation + 90) % 360);
            }}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            title="Rotation"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetTransforms();
            }}
            className="px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors text-sm"
            title="Réinitialiser"
          >
            Reset
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            title="Télécharger"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            title="Partager"
          >
            <Share2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            title="Fermer (Escape)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex w-full h-full">
        <div 
          className={`flex items-center justify-center transition-all duration-300 ${
            showInfo ? 'w-2/3' : 'w-full'
          } pt-20 pb-4`}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={image.url}
            alt={image.originalname}
            className="max-w-full max-h-full object-contain transition-all duration-300 select-none"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
            draggable={false}
          />
        </div>

        {/* Panneau d'informations */}
        {showInfo && (
          <div 
            className="w-1/3 bg-gray-900 bg-opacity-95 backdrop-blur-sm border-l border-gray-700 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6 text-white">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                <Info className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">Informations</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-400">Nom original</p>
                    <p className="font-medium break-words">{image.originalname}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-400">Nom de fichier</p>
                    <p className="font-mono text-sm break-words text-gray-300">{image.filename}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Taille</p>
                    <p className="font-medium">{UploadService.formatFileSize(image.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Format</p>
                    <p className="font-medium">{image.format.toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-400">Type MIME</p>
                    <p className="font-mono text-sm text-gray-300">{image.mimetype}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">Date d'upload</p>
                    <p className="font-medium">{uploadDate.date}</p>
                    <p className="text-sm text-gray-400">{uploadDate.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-400">URL</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(image.url);
                        alert('URL copiée !');
                      }}
                      className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors break-all text-left"
                      title="Cliquer pour copier"
                    >
                      {image.url}
                    </button>
                  </div>
                </div>

                {image.id && (
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-400">ID</p>
                      <p className="font-mono text-xs text-gray-300 break-all">{image.id}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Actions rapides</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(image.url);
                      alert('URL copiée dans le presse-papiers !');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <Link className="w-4 h-4" />
                    <span>Copier l'URL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!showInfo && (
        <div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm">
          <p>
            Format: {image.format.toUpperCase()} • 
            Uploadé le {uploadDate.date} à {uploadDate.time} • 
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(true);
              }}
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              Plus d'infos (I)
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onRemove,
  onReplace,
  showActions = true,
  isSelected = false,
  onToggleSelect,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemove = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?');
    if (!confirmed) return;

    setIsDeleting(true);
    
    try {
      await UploadService.deleteImage(image.filename);
      console.log('✅ Image supprimée avec succès');
      onRemove?.(image.filename);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      
      if (error instanceof Error && 
          (error.message.includes('non trouvée') || 
           error.message.includes('déjà supprimée'))) {
        console.log('ℹ️ Image déjà supprimée, nettoyage de l\'interface');
        onRemove?.(image.filename);
      } else {
        alert('Erreur lors de la suppression de l\'image: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
      }
    } finally {
      setIsDeleting(false);
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

  // Gestionnaire de clic sur l'image
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // Gestionnaire de clic sur la sélection
  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.();
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        <div 
          className={`aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative border-2 transition-all duration-200 ${
            isSelected 
              ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
              : 'border-transparent hover:border-gray-300'
          }`}
        >
          <img
            src={image.url}
            alt={image.originalname}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 cursor-pointer"
            loading="lazy"
            onClick={handleImageClick}
          />
          
          {/* Indicateur de clic */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Cliquer pour agrandir</span>
              </div>
            </div>
          </div>

          {/* Checkbox de sélection */}
          {onToggleSelect && (
            <button
              onClick={handleSelectClick}
              className="absolute top-2 left-2 z-10 p-1 bg-white dark:bg-gray-800 rounded shadow-lg hover:scale-110 transition-transform"
              title={isSelected ? 'Désélectionner' : 'Sélectionner'}
            >
              {isSelected ? (
                <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-gray-400 rounded bg-white"></div>
              )}
            </button>
          )}

          {/* Badge de format */}
          <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
            {image.format.toUpperCase()}
          </div>
        </div>

        {/* Actions au hover */}
        {showActions && (
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex justify-center gap-1">
              {onReplace && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplace();
                  }}
                  className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
                  title="Remplacer"
                >
                  <RotateCcw className="w-3 h-3 text-blue-600" />
                </button>
              )}

              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={isDeleting}
                  className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Supprimer"
                >
                  <X className="w-3 h-3 text-red-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Suppression...</span>
            </div>
          </div>
        )}

        {/* Info en bas */}
        <div className="mt-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={image.originalname}>
            {image.originalname}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {UploadService.formatFileSize(image.size)}
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