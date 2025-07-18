// frontend/src/services/auth.service.ts - Version corrigée

import { apiService } from './api';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  credits: number;
  plan: 'free' | 'pro' | 'enterprise';
  isVerified: boolean;
  createdAt: string;
  profile: {
    avatar?: string;
    company?: string;
    phone?: string;
  };
  settings: {
    notifications: boolean;
    emailMarketing: boolean;
    language: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<any>('/auth/login', credentials);
     
      // Adapter selon la structure réelle de votre backend
      const user = response.user || response.data?.user;
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      if (response.success && token && refreshToken && user) {
        // Stocker les tokens
        apiService.setAuthTokens(token, refreshToken);
       
        // Stocker l'utilisateur
        localStorage.setItem('user', JSON.stringify(user));
        
        return {
          user,
          token,
          refreshToken
        };
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur de connexion';
      throw new Error(message);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<any>('/auth/register', userData);
     
      // Adapter selon la structure réelle de votre backend
      const user = response.user || response.data?.user;
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      if (response.success && token && refreshToken && user) {
        // Stocker les tokens
        apiService.setAuthTokens(token, refreshToken);
       
        // Stocker l'utilisateur
        localStorage.setItem('user', JSON.stringify(user));
        
        return {
          user,
          token,
          refreshToken
        };
      } else {
        throw new Error(response.message || 'Erreur d\'inscription');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur d\'inscription';
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // On continue même si la requête échoue
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le stockage local
      apiService.clearAuthTokens();
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<any>('/auth/me');
     
      // Adapter selon la structure réelle de votre backend
      const user = response.user || response.data?.user || response.data;

      if (response.success && user) {
        // Mettre à jour l'utilisateur stocké
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      } else {
        throw new Error('Utilisateur non trouvé');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la récupération du profil');
    }
  }

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  getStoredToken(): string | null {
    return apiService.getStoredToken();
  }

  isAuthenticated(): boolean {
    return !!(this.getStoredToken() && this.getStoredUser());
  }
}

export const authService = new AuthService();