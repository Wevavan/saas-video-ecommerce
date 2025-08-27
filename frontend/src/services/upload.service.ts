// frontend/src/services/upload.service.ts - VERSION CORRIGÉE

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fonction pour récupérer le token d'auth
const getAuthToken = (): string | null => {
  // Essayer plusieurs emplacements possibles pour le token
  let token = localStorage.getItem('accessToken') || 
              localStorage.getItem('authToken') ||
              sessionStorage.getItem('accessToken') ||
              sessionStorage.getItem('authToken');
  
  if (!token) {
    // Essayer de parser les données d'auth
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
};

// ✅ CLASSE UPLOADSERVICE EXPORTÉE
export class UploadService {
  // Validation des fichiers
  static validateFiles(files: File[]): { valid: boolean; error?: string } {
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
  }

  // Upload des images avec callback de progression
  static async uploadImages(
    files: File[], 
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<any[]> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Gestion de la progression
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          });
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
          console.error('❌ Erreur parsing réponse upload:', error);
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

      // Configuration de la requête
      xhr.open('POST', `${API_BASE_URL}/upload/images`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 60000; // 60 secondes timeout

      // Envoi de la requête
      xhr.send(formData);
    });
  }

  // Suppression d'image
  static async deleteImage(filename: string): Promise<boolean> {
    console.log('🗑️ Service deleteImage appelé:', filename);
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload/image/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🗑️ Réponse statut:', response.status);

      // ✅ Gestion des différents codes de statut
      if (response.ok) {
        console.log('✅ Image supprimée avec succès');
        return true;
      }

      if (response.status === 410) {
        // Image déjà supprimée - traiter comme un succès
        console.log('ℹ️ Image déjà supprimée (410 Gone)');
        return true;
      }

      if (response.status === 404) {
        console.log('⚠️ Image non trouvée (404)');
        throw new Error('Image non trouvée');
      }

      if (response.status === 409) {
        console.log('⚠️ Conflit lors de la suppression (409)');
        throw new Error('Conflit lors de la suppression');
      }

      if (response.status === 401) {
        console.log('🔒 Non autorisé (401)');
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      if (response.status === 403) {
        console.log('🚫 Interdit (403)');
        throw new Error('Vous n\'êtes pas autorisé à supprimer cette image');
      }

      // Autres erreurs
      let errorMessage = 'Erreur lors de la suppression';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('❌ Erreur serveur:', errorData);
      } catch (jsonError) {
        console.log('❌ Erreur parsing JSON:', jsonError);
      }

      throw new Error(errorMessage);

    } catch (error) {
      if (error instanceof Error) {
        console.log('❌ Erreur suppression:', error.message);
        throw error;
      }
      
      console.log('❌ Erreur inconnue:', error);
      throw new Error('Erreur réseau lors de la suppression');
    }
  }

  // Récupération des images utilisateur
  static async getUserImages(page: number = 1, limit: number = 20) {
    console.log('📋 Récupération images utilisateur, page:', page);
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload/images?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des images');
      }

      console.log('✅ Images récupérées:', data.data.images.length);
      return data.data;

    } catch (error) {
      console.error('❌ Erreur récupération images:', error);
      throw error;
    }
  }

  // Récupération des infos d'une image
  static async getImageInfo(filename: string) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload/image/${filename}/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Image non trouvée');
        }
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des informations');
      }

      return data.data;

    } catch (error) {
      console.error('❌ Erreur récupération info image:', error);
      throw error;
    }
  }

  // Utilitaire pour formater la taille des fichiers
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ✅ EXPORTS INDIVIDUELS POUR COMPATIBILITÉ
export const uploadImages = UploadService.uploadImages.bind(UploadService);
export const deleteImage = UploadService.deleteImage.bind(UploadService);
export const getUserImages = UploadService.getUserImages.bind(UploadService);
export const getImageInfo = UploadService.getImageInfo.bind(UploadService);
export const formatFileSize = UploadService.formatFileSize.bind(UploadService);
export const validateFiles = UploadService.validateFiles.bind(UploadService);

// Export par défaut
export default UploadService;