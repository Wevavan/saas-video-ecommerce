// frontend/src/components/upload/ImageModalHandler.tsx

import React, { useState, useEffect } from 'react';
import { UploadedImage } from '../../types/upload.types';

interface ImageModalHandlerProps {
  children: React.ReactNode;
}

// Modal component réutilisable (copie de celle dans ImagePreview)
const ImageModal: React.FC<{
  image: UploadedImage | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ image, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  if (!isOpen || !image) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.originalname;
    link.click();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: image.originalname,
          url: image.url
        });
      } else {
        await navigator.clipboard.writeText(image.url);
        alert('URL copiée dans le presse-papiers');
      }
    } catch (error) {
      console.error('Erreur partage/copie:', error);
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
        minute: '2-digit'
      })
    };
  };

  const uploadDate = formatDate(image.uploadedAt);

  // Gestion des raccourcis clavier
  useEffect(() => {
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
            ({(image.size / 1024 / 1024).toFixed(2)} MB)
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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10h-6" />
            </svg>
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM15 10l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRotation((rotation + 90) % 360);
            }}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            title="Rotation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            title="Partager"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          
          <button
            onClick={onClose}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            title="Fermer (Escape)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image et panneau d'infos */}
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
            <div className="p-6 space-y-4 text-white text-sm">
              <h2 className="text-lg font-semibold mb-4">Informations</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-xs">Nom original</p>
                  <p className="font-medium break-words">{image.originalname}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Nom de fichier</p>
                  <p className="font-mono text-xs break-words text-gray-300">{image.filename}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Taille</p>
                  <p className="font-medium">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Format</p>
                  <p className="font-medium">{image.format.toUpperCase()}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Type MIME</p>
                  <p className="font-mono text-xs text-gray-300">{image.mimetype}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Date d'upload</p>
                  <p className="font-medium">{uploadDate.date}</p>
                  <p className="text-gray-400 text-xs">{uploadDate.time}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">URL</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(image.url);
                      alert('URL copiée !');
                    }}
                    className="font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors break-all text-left"
                    title="Cliquer pour copier"
                  >
                    {image.url}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      {!showInfo && (
        <div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm">
          <p>
            Format: {image.format.toUpperCase()} • 
            Uploadé le {uploadDate.date} • 
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

export const ImageModalHandler: React.FC<ImageModalHandlerProps> = ({ children }) => {
  const [modalImage, setModalImage] = useState<UploadedImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      setModalImage(event.detail);
      setIsModalOpen(true);
    };

    document.addEventListener('openImageModal', handleOpenModal as EventListener);
    
    return () => {
      document.removeEventListener('openImageModal', handleOpenModal as EventListener);
    };
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage(null);
  };

  return (
    <>
      {children}
      <ImageModal
        image={modalImage}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};