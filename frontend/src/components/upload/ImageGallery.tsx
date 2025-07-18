import React, { useState } from 'react';
import { 
  Grid, 
  List, 
  CheckSquare, 
  Square, 
  Trash2, 
  Download, 
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { UploadedImage } from '../../types/upload.types';
import { ImagePreview } from './ImagePreview';
import { UploadService } from '../../services/upload.service';

interface ImageGalleryProps {
  images: UploadedImage[];
  selectedImages: string[];
  onImageSelect: (filename: string) => void;
  onImageUnselect: (filename: string) => void;
  onImageRemove: (filename: string) => void;
  onImageReplace?: (filename: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  loading?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'date' | 'size';
type FilterMode = 'all' | 'jpg' | 'png' | 'webp';

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  selectedImages,
  onImageSelect,
  onImageUnselect,
  onImageRemove,
  onImageReplace,
  onSelectAll,
  onUnselectAll,
  loading = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrage et tri des images
  const filteredAndSortedImages = React.useMemo(() => {
    let filtered = images;

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(img =>
        img.originalname.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrage par format
    if (filterMode !== 'all') {
      filtered = filtered.filter(img =>
        img.format.toLowerCase() === filterMode
      );
    }

    // Tri
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
    if (selectedImages.includes(filename)) {
      onImageUnselect(filename);
    } else {
      onImageSelect(filename);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedImages.length} image(s) ?`
    );
    
    if (confirmed) {
      for (const filename of selectedImages) {
        try {
          await UploadService.deleteImage(filename);
          onImageRemove(filename);
        } catch (error) {
          console.error(`Erreur suppression ${filename}:`, error);
        }
      }
      onUnselectAll();
    }
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

  const allSelected = filteredAndSortedImages.length > 0 && 
    filteredAndSortedImages.every(img => selectedImages.includes(img.filename));

  const someSelected = selectedImages.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une image..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tous formats</option>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="date">Plus récent</option>
            <option value="name">Nom A-Z</option>
            <option value="size">Plus volumineux</option>
          </select>

          {/* Toggle vue */}
          <div className="flex bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
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
              className={`p-2 rounded transition-colors ${
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
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedImages.length} image(s) sélectionnée(s)
            </span>
            <button
              onClick={onUnselectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Tout désélectionner
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Header avec sélection globale et stats */}
      {filteredAndSortedImages.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={allSelected ? onUnselectAll : onSelectAll}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          
          <span className="text-sm text-gray-500">
            {filteredAndSortedImages.length} image(s) • {UploadService.formatFileSize(
              filteredAndSortedImages.reduce((total, img) => total + img.size, 0)
            )}
          </span>
        </div>
      )}

      {/* Galerie */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Chargement des images...</span>
          </div>
        </div>
      ) : filteredAndSortedImages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            {searchQuery || filterMode !== 'all' 
              ? 'Aucune image ne correspond aux critères'
              : 'Aucune image disponible'
            }
          </p>
          {(searchQuery || filterMode !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vue grille */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSortedImages.map((image) => (
            <div key={image.filename} className="relative group">
              {/* Checkbox de sélection */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(image.filename);
                }}
                className="absolute top-2 left-2 z-10 p-1 bg-white dark:bg-gray-800 rounded shadow-lg hover:scale-110 transition-transform"
                title={selectedImages.includes(image.filename) ? 'Désélectionner' : 'Sélectionner'}
              >
                {selectedImages.includes(image.filename) ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {/* Badge de format */}
              <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                {image.format.toUpperCase()}
              </div>
              
              <ImagePreview
                image={image}
                onRemove={onImageRemove}
                onReplace={onImageReplace}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedImages.includes(image.filename)
                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                    : ''
                }`}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Vue liste */
        <div className="space-y-2">
          {filteredAndSortedImages.map((image) => (
            <div
              key={image.filename}
              className={`flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedImages.includes(image.filename)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => handleImageClick(image.filename)}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(image.filename);
                }}
                className="p-1"
                title={selectedImages.includes(image.filename) ? 'Désélectionner' : 'Sélectionner'}
              >
                {selectedImages.includes(image.filename) ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {/* Miniature */}
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={image.url}
                  alt={image.originalname}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Informations */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {image.originalname}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{UploadService.formatFileSize(image.size)}</span>
                  <span>{image.format.toUpperCase()}</span>
                  <span>{new Date(image.uploadedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = image.url;
                    link.download = image.originalname;
                    link.click();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {onImageReplace && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageReplace(image.filename);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Remplacer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Supprimer "${image.originalname}" ?`)) {
                      onImageRemove(image.filename);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer avec statistiques */}
      {filteredAndSortedImages.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
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