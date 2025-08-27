// frontend/src/components/upload/ImageGallery.tsx - CODE COMPLET FINAL

import React, { useState } from 'react';
import { 
  Grid, 
  List, 
  Trash2, 
  Download, 
  RefreshCw,
  Search,
  X,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import { UploadedImage } from '../../types/upload.types';
import { ImagePreview } from './ImagePreview';
import { UploadService } from '../../services/upload.service';

interface ImageGalleryProps {
  images: UploadedImage[];
  selectedImages?: string[];
  onImageSelect?: (filename: string) => void;
  onImageUnselect?: (filename: string) => void;
  onImageRemove: (filename: string) => void;
  onImageReplace?: (filename: string) => void;
  onSelectAll?: () => void;
  onUnselectAll?: () => void;
  showSelection?: boolean;
  loading?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'date' | 'size';
type FilterMode = 'all' | 'jpg' | 'png' | 'webp';

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  selectedImages = [],
  onImageSelect,
  onImageUnselect,
  onImageRemove,
  onImageReplace,
  onSelectAll,
  onUnselectAll,
  showSelection = false,
  loading = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());

  // Filtrage et tri des images
  const filteredAndSortedImages = React.useMemo(() => {
    let filtered = images;

    if (searchQuery) {
      filtered = filtered.filter(img =>
        img.originalname.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterMode !== 'all') {
      filtered = filtered.filter(img =>
        img.format.toLowerCase() === filterMode
      );
    }

    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'name':
          return a.originalname.localeCompare(b.originalname);
        case 'date':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return filtered;
  }, [images, searchQuery, filterMode, sortMode]);

  const handleImageClick = (filename: string) => {
    if (!showSelection) return;
    
    if (selectedImages.includes(filename)) {
      onImageUnselect?.(filename);
    } else {
      onImageSelect?.(filename);
    }
  };

  const handleSingleDelete = async (filename: string) => {
    if (deletingImages.has(filename)) return;

    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?');
    if (!confirmed) return;

    setDeletingImages(prev => new Set(prev).add(filename));

    try {
      await UploadService.deleteImage(filename);
      onImageRemove(filename);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      
      if (error instanceof Error && 
          (error.message.includes('non trouvée') || 
           error.message.includes('déjà supprimée'))) {
        onImageRemove(filename);
      } else {
        alert('Erreur lors de la suppression: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
      }
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(filename);
        return newSet;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedImages.length} image(s) ?`
    );
    
    if (!confirmed) return;

    setDeletingImages(prev => {
      const newSet = new Set(prev);
      selectedImages.forEach(filename => newSet.add(filename));
      return newSet;
    });

    for (const filename of selectedImages) {
      try {
        await UploadService.deleteImage(filename);
        onImageRemove(filename);
      } catch (error) {
        console.error(`❌ Erreur suppression ${filename}:`, error);
        
        if (error instanceof Error && 
            (error.message.includes('non trouvée') || 
             error.message.includes('déjà supprimée'))) {
          onImageRemove(filename);
        }
      }
    }

    setDeletingImages(prev => {
      const newSet = new Set(prev);
      selectedImages.forEach(filename => newSet.delete(filename));
      return newSet;
    });

    onUnselectAll?.();
  };

  const handleBulkDownload = () => {
    if (selectedImages.length === 0) return;
    
    selectedImages.forEach(filename => {
      const image = images.find(img => img.filename === filename);
      if (image) {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = image.originalname;
        link.click();
      }
    });
  };

  const allSelected = showSelection && filteredAndSortedImages.length > 0 && 
    filteredAndSortedImages.every(img => selectedImages.includes(img.filename));

  const someSelected = showSelection && selectedImages.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une image..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres et tri */}
        <div className="flex gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="all">Tous</option>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="date">Récent</option>
            <option value="name">Nom</option>
            <option value="size">Taille</option>
          </select>

          {/* Toggle vue */}
          <div className="flex bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              title="Vue grille"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              title="Vue liste"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barre de sélection */}
      {someSelected && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedImages.length} sélectionnée(s)
            </span>
            <button
              onClick={onUnselectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Tout désélectionner
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Télécharger</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedImages.some(filename => deletingImages.has(filename))}
              className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      )}

      {/* Header avec stats */}
      {filteredAndSortedImages.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          {showSelection && (
            <button
              onClick={allSelected ? onUnselectAll : onSelectAll}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}</span>
            </button>
          )}
          
          <span className="text-gray-500 ml-auto">
            {filteredAndSortedImages.length} image(s) • {UploadService.formatFileSize(
              filteredAndSortedImages.reduce((total, img) => total + img.size, 0)
            )}
          </span>
        </div>
      )}

      {/* Galerie */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Chargement...</span>
          </div>
        </div>
      ) : filteredAndSortedImages.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {searchQuery || filterMode !== 'all' 
              ? 'Aucune image trouvée'
              : 'Aucune image'
            }
          </p>
          {(searchQuery || filterMode !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vue grille compacte */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {filteredAndSortedImages.map((image) => (
            <div key={image.filename} className="relative">
              {/* Indicateur de suppression */}
              {deletingImages.has(image.filename) && (
                <div className="absolute inset-0 z-20 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-white animate-spin" />
                </div>
              )}
              
              <ImagePreview
                image={image}
                onRemove={handleSingleDelete}
                onReplace={onImageReplace}
                isSelected={selectedImages.includes(image.filename)}
                onToggleSelect={showSelection ? () => handleImageClick(image.filename) : undefined}
                className={`${deletingImages.has(image.filename) ? 'opacity-50' : ''}`}
                showActions={!deletingImages.has(image.filename)}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Vue liste compacte */
        <div className="space-y-1">
          {filteredAndSortedImages.map((image) => (
            <div
              key={image.filename}
              className={`flex items-center gap-3 p-2 border rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedImages.includes(image.filename)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } ${deletingImages.has(image.filename) ? 'opacity-50' : ''}`}
            >
              {/* Checkbox */}
              {showSelection && (
                <button
                  onClick={() => !deletingImages.has(image.filename) && handleImageClick(image.filename)}
                  className="flex-shrink-0"
                  disabled={deletingImages.has(image.filename)}
                  title={selectedImages.includes(image.filename) ? 'Désélectionner' : 'Sélectionner'}
                >
                  {selectedImages.includes(image.filename) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              )}
              
              {/* Miniature cliquable */}
              <div 
                className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                onClick={() => {
                  const event = new CustomEvent('openImageModal', { detail: image });
                  document.dispatchEvent(event);
                }}
                title="Cliquer pour agrandir"
              >
                <img
                  src={image.url}
                  alt={image.originalname}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Informations */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {image.originalname}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{UploadService.formatFileSize(image.size)}</span>
                  <span>{image.format.toUpperCase()}</span>
                  <span>{new Date(image.uploadedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                {deletingImages.has(image.filename) ? (
                  <div className="flex items-center gap-1 text-gray-500">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Suppression...</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const event = new CustomEvent('openImageModal', { detail: image });
                        document.dispatchEvent(event);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Voir en grand"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = image.url;
                        link.download = image.originalname;
                        link.click();
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    
                    {onImageReplace && (
                      <button
                        onClick={() => onImageReplace(image.filename)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Remplacer"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleSingleDelete(image.filename)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer avec statistiques */}
      {filteredAndSortedImages.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span>
            {images.length} image(s) au total
            {searchQuery || filterMode !== 'all' ? 
              ` • ${filteredAndSortedImages.length} affichée(s)` : ''
            }
          </span>
          <span>
            Taille totale : {UploadService.formatFileSize(
              images.reduce((total, img) => total + img.size, 0)
            )}
          </span>
        </div>
      )}
    </div>
  );
};