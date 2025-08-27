// backend/src/services/auth.service.ts - VERSION CORRIGÉE

import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  // ✅ CORRIGÉ : Utiliser la variable d'environnement
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '30d';

  static generateAccessToken(userId: string, email: string): string {
      // ✅ UTILISEZ directement process.env
      const secret = process.env.JWT_SECRET!;
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      
      console.log('🔑 JWT_SECRET direct:', secret?.substring(0, 10) + '...');
      
      return jwt.sign(
        { userId, email, type: 'access' },
        secret,
        { expiresIn }
      );
    }

  static generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_SECRET!;
    
    return jwt.sign(
      { userId, type: 'refresh' },
      secret,
      { expiresIn: '30d' }
    );
  }

  static verifyToken(token: string): any {
    try {
      const secret = process.env.JWT_SECRET!;
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  static async register(email: string, password: string, name: string) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Créer l'utilisateur (le hash du password se fait automatiquement via le middleware pre-save)
    const user = new User({
      email,
      password, // Le hash se fait automatiquement
      name,
      credits: 100, // ✅ CORRIGÉ : 100 crédits gratuits (pas 10)
      plan: 'free'
    });
    
    await user.save();

    // Générer les tokens
    const accessToken = this.generateAccessToken(user._id.toString(), user.email);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    // Retourner la réponse (toJSON() masque automatiquement le password)
    return {
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    };
  }

  static async login(email: string, password: string) {
    // Trouver l'utilisateur avec le password (select: false par défaut)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe (méthode du modèle)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Mettre à jour la dernière connexion
    user.lastLoginAt = new Date();
    await user.save();

    // Générer les tokens
    const accessToken = this.generateAccessToken(user._id.toString(), user.email);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    return {
      user: user.toJSON(), // toJSON() masque automatiquement le password
      tokens: { accessToken, refreshToken }
    };
  }

  static async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = this.verifyToken(refreshToken);
     
      if (decoded.type !== 'refresh') {
        throw new Error('Token de rafraîchissement invalide');
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const accessToken = this.generateAccessToken(user._id.toString(), user.email);
      
      return { accessToken };
    } catch (error) {
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  static async getCurrentUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    return user;
  }
}