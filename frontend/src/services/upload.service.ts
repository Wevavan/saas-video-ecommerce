import { UploadedImage, UploadResponse, UploadError } from '../types/upload.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class UploadService {
  private static getAuthToken(): string | null {
    // Récupérer le token depuis le context auth ou localStorage
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.token || parsed.data?.token;
      } catch (e) {
        console.error('Erreur parsing auth data:', e);
        return null;
      }
    }
    return null;
  }

  static async uploadImages(
    files: File[],
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<UploadedImage[]> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Gestion du progress
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
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: UploadResponse = JSON.parse(xhr.responseText);
            if (response.success && response.data.images) {
              resolve(response.data.images);
            } else {
              reject(new Error(response.message || 'Erreur lors de l\'upload'));
            }
          } catch (e) {
            reject(new Error('Erreur de parsing de la réponse'));
          }
        } else {
          try {
            const errorResponse: UploadError = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `Erreur HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Erreur HTTP ${xhr.status}`));
          }
        }
      });

      // Gestion des erreurs
      xhr.addEventListener('error', () => {
        reject(new Error('Erreur réseau lors de l\'upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Timeout lors de l\'upload'));
      });

      // Configuration et envoi
      xhr.open('POST', `${API_BASE_URL}/api/upload/images`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 60000; // 60 secondes timeout
      xhr.send(formData);
    });
  }

  static async deleteImage(filename: string): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/image/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.success;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }
  }

  static async getImageInfo(filename: string): Promise<UploadedImage> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/info/${filename}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        } else {
          throw new Error(data.message || 'Erreur lors de la récupération des informations');
        }
      } else {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur récupération info:', error);
      throw error;
    }
  }

  // Validation côté client
  static validateFiles(files: File[]): { valid: boolean; error?: string } {
    const UPLOAD_CONFIG = {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
    };

    if (files.length === 0) {
      return { valid: false, error: 'Aucun fichier sélectionné' };
    }

    if (files.length > UPLOAD_CONFIG.maxFiles) {
      return { valid: false, error: `Maximum ${UPLOAD_CONFIG.maxFiles} fichiers autorisés` };
    }

    for (const file of files) {
      // Vérification taille
      if (file.size > UPLOAD_CONFIG.maxFileSize) {
        return { 
          valid: false, 
          error: `Le fichier "${file.name}" est trop volumineux (max 5MB)` 
        };
      }

      // Vérification type MIME
      if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
        return { 
          valid: false, 
          error: `Le fichier "${file.name}" n'est pas un format d'image supporté` 
        };
      }

      // Vérification extension
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
        return { 
          valid: false, 
          error: `L'extension "${extension}" n'est pas supportée` 
        };
      }
    }

    return { valid: true };
  }

  // Utilitaires
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  static getImageUrl(filename: string): string {
    return `${API_BASE_URL}/uploads/${filename}`;
  }
}