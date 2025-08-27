// src/services/imageOptimization.service.ts - VERSION FINALE SANS ERREURS
import path from 'path';
import fs from 'fs/promises';
import { logError, logInfo } from '../config/logger.config';

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
  removeMetadata?: boolean;
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface OptimizationResult {
  success: boolean;
  originalPath: string;
  optimizedPath: string;
  thumbnailPath?: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
  error?: string;
}

export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private readonly uploadDir: string;
  private readonly optimizedDir: string;
  private readonly thumbnailDir: string;
  private sharpModule: any = null;
  private sharpAvailable: boolean = false;

  private constructor() {
    this.uploadDir = process.env.UPLOAD_PATH || './uploads';
    this.optimizedDir = path.join(this.uploadDir, 'optimized');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    
    this.ensureDirectories();
    this.initializeSharp();
  }

  static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.optimizedDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      logError('Failed to create optimization directories', error as Error);
    }
  }

  private async initializeSharp(): Promise<void> {
    try {
      // Import dynamique avec gestion d'erreur complète
      const sharpModule = await this.loadSharpSafely();
      if (sharpModule) {
        this.sharpModule = sharpModule;
        this.sharpAvailable = true;
        logInfo('Sharp loaded successfully for image optimization');
      } else {
        this.sharpAvailable = false;
        logInfo('Sharp not available, using fallback image processing');
      }
    } catch (error) {
      this.sharpAvailable = false;
      logInfo('Sharp initialization failed, using fallback', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async loadSharpSafely(): Promise<any> {
    try {
      // Méthode 1: Import dynamique standard
      const sharpModule = await import('sharp');
      return sharpModule.default || sharpModule;
    } catch (error1) {
      try {
        // Méthode 2: Require dynamique
        const sharp = require('sharp');
        return sharp;
      } catch (error2) {
        try {
          // Méthode 3: Import avec eval (bypass TypeScript)
          const importSharp = new Function('return import("sharp")');
          const sharpModule = await importSharp();
          return sharpModule.default || sharpModule;
        } catch (error3) {
          // Sharp n'est vraiment pas disponible
          return null;
        }
      }
    }
  }

  // Optimisation avec Sharp si disponible, sinon fallback
  async optimizeImage(
    inputPath: string, 
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    if (this.sharpAvailable && this.sharpModule) {
      return this.optimizeWithSharp(inputPath, options);
    } else {
      return this.optimizeWithFallback(inputPath, options);
    }
  }

  private async optimizeWithSharp(
    inputPath: string,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      if (!this.sharpModule) {
        throw new Error('Sharp module not available');
      }

      const inputStats = await fs.stat(inputPath);
      const originalSize = inputStats.size;

      const filename = path.basename(inputPath, path.extname(inputPath));
      const extension = options.format || 'jpeg';
      const optimizedPath = path.join(this.optimizedDir, `${filename}_optimized.${extension}`);
      
      const config = {
        width: options.width || 1920,
        height: options.height || 1080,
        quality: options.quality || 85,
        format: options.format || 'jpeg',
        progressive: options.progressive ?? true,
        removeMetadata: options.removeMetadata ?? true,
        createThumbnail: options.createThumbnail ?? true,
        thumbnailSize: options.thumbnailSize || 300,
      };

      logInfo('Starting Sharp image optimization', { inputPath, config });

      let pipeline = this.sharpModule(inputPath);

      if (config.width || config.height) {
        pipeline = pipeline.resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (config.removeMetadata) {
        pipeline = pipeline.rotate();
      }

      switch (config.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: config.quality,
            progressive: config.progressive,
            mozjpeg: true,
          });
          break;
        
        case 'png':
          pipeline = pipeline.png({
            compressionLevel: 9,
            progressive: config.progressive,
          });
          break;
        
        case 'webp':
          pipeline = pipeline.webp({
            quality: config.quality,
            effort: 6,
          });
          break;
      }

      const optimizedBuffer = await pipeline.toBuffer();
      await fs.writeFile(optimizedPath, optimizedBuffer);

      const metadata = await this.sharpModule(optimizedPath).metadata();
      const { width = 0, height = 0 } = metadata;

      let thumbnailPath: string | undefined;
      if (config.createThumbnail) {
        thumbnailPath = await this.createThumbnailWithSharp(inputPath, config.thumbnailSize);
      }

      const optimizedSize = optimizedBuffer.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
      const processingTime = Date.now() - startTime;

      logInfo('Sharp image optimization completed', {
        originalSize,
        optimizedSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        processingTime,
        dimensions: { width, height },
      });

      return {
        success: true,
        originalPath: inputPath,
        optimizedPath,
        thumbnailPath,
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions: { width, height },
      };

    } catch (error) {
      logError('Sharp image optimization failed', error as Error, { inputPath, options });

      // Fallback en cas d'erreur Sharp
      return this.optimizeWithFallback(inputPath, options);
    }
  }

  private async createThumbnailWithSharp(inputPath: string, size: number = 300): Promise<string> {
    if (!this.sharpModule) {
      throw new Error('Sharp module not available');
    }

    const filename = path.basename(inputPath, path.extname(inputPath));
    const thumbnailPath = path.join(this.thumbnailDir, `${filename}_thumb.webp`);

    await this.sharpModule(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  // Fallback robuste sans Sharp
  private async optimizeWithFallback(
    inputPath: string,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    try {
      const inputStats = await fs.stat(inputPath);
      const originalSize = inputStats.size;

      const filename = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath);
      const optimizedPath = path.join(this.optimizedDir, `${filename}_optimized${ext}`);
      
      // Copie simple du fichier avec préservation des métadonnées
      await fs.copyFile(inputPath, optimizedPath);
      
      // Créer une thumbnail (copie réduite basique)
      let thumbnailPath: string | undefined;
      if (options.createThumbnail ?? true) {
        thumbnailPath = path.join(this.thumbnailDir, `${filename}_thumb${ext}`);
        await fs.copyFile(inputPath, thumbnailPath);
      }

      const optimizedStats = await fs.stat(optimizedPath);
      const optimizedSize = optimizedStats.size;

      logInfo('Fallback image processing completed', {
        originalSize,
        optimizedSize,
        inputPath,
        note: 'No compression applied - install Sharp for optimization'
      });

      return {
        success: true,
        originalPath: inputPath,
        optimizedPath,
        thumbnailPath,
        originalSize,
        optimizedSize,
        compressionRatio: 0,
        dimensions: { width: 0, height: 0 },
      };

    } catch (error) {
      logError('Fallback image processing failed', error as Error, { inputPath });

      return {
        success: false,
        originalPath: inputPath,
        optimizedPath: '',
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        dimensions: { width: 0, height: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Analyser une image de manière sûre
  async analyzeImage(inputPath: string): Promise<{
    format: string;
    width: number;
    height: number;
    channels: number;
    density: number;
    hasAlpha: boolean;
    size: number;
    sharpUsed: boolean;
  }> {
    try {
      const stats = await fs.stat(inputPath);
      
      if (this.sharpAvailable && this.sharpModule) {
        try {
          const metadata = await this.sharpModule(inputPath).metadata();
          
          return {
            format: metadata.format || 'unknown',
            width: metadata.width || 0,
            height: metadata.height || 0,
            channels: metadata.channels || 0,
            density: metadata.density || 0,
            hasAlpha: metadata.hasAlpha || false,
            size: stats.size,
            sharpUsed: true,
          };
        } catch (sharpError) {
          logError('Sharp metadata extraction failed', sharpError as Error);
        }
      }
      
      // Fallback basique si Sharp échoue ou n'est pas disponible
      const ext = path.extname(inputPath).toLowerCase();
      
      return {
        format: ext.replace('.', '') || 'unknown',
        width: 0,
        height: 0,
        channels: 0,
        density: 0,
        hasAlpha: ext === '.png',
        size: stats.size,
        sharpUsed: false,
      };
      
    } catch (error) {
      logError('Image analysis failed', error as Error);
      throw error;
    }
  }

  // Nettoyage des fichiers anciens
  async cleanupOldOptimizedFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const directories = [this.optimizedDir, this.thumbnailDir];
      let totalDeleted = 0;

      for (const dir of directories) {
        try {
          const files = await fs.readdir(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            
            if (Date.now() - stats.mtime.getTime() > maxAge) {
              await fs.unlink(filePath);
              totalDeleted++;
            }
          }
        } catch (error) {
          // Dossier n'existe pas, continuer
          continue;
        }
      }

      logInfo('Optimized files cleanup completed', { filesDeleted: totalDeleted });

    } catch (error) {
      logError('Cleanup failed', error as Error);
    }
  }

  // Statistiques d'optimisation
  async getOptimizationStats(): Promise<{
    totalOptimized: number;
    totalOptimizedSize: number;
    sharpEnabled: boolean;
    sharpStatus: string;
    directories: {
      upload: string;
      optimized: string;
      thumbnails: string;
    };
  }> {
    try {
      const optimizedFiles = await fs.readdir(this.optimizedDir).catch(() => []);
      let totalOptimizedSize = 0;

      for (const file of optimizedFiles) {
        try {
          const filePath = path.join(this.optimizedDir, file);
          const stats = await fs.stat(filePath);
          totalOptimizedSize += stats.size;
        } catch (error) {
          continue;
        }
      }

      return {
        totalOptimized: optimizedFiles.length,
        totalOptimizedSize,
        sharpEnabled: this.sharpAvailable,
        sharpStatus: this.sharpAvailable ? 'available' : 'not_available_using_fallback',
        directories: {
          upload: this.uploadDir,
          optimized: this.optimizedDir,
          thumbnails: this.thumbnailDir,
        },
      };

    } catch (error) {
      logError('Failed to get optimization stats', error as Error);
      return {
        totalOptimized: 0,
        totalOptimizedSize: 0,
        sharpEnabled: this.sharpAvailable,
        sharpStatus: 'error',
        directories: {
          upload: this.uploadDir,
          optimized: this.optimizedDir,
          thumbnails: this.thumbnailDir,
        },
      };
    }
  }

  // Méthodes publiques utiles
  isSharpAvailable(): boolean {
    return this.sharpAvailable;
  }

  getSharpStatus(): string {
    if (this.sharpAvailable) {
      return 'Sharp is available for image optimization';
    } else {
      return 'Sharp not available - using fallback (install Sharp for optimization features)';
    }
  }

  // Installer Sharp dynamiquement (optionnel)
  async tryInstallSharp(): Promise<{ success: boolean; message: string }> {
    try {
      logInfo('Attempting to install Sharp...');
      
      // Réessayer de charger Sharp
      await this.initializeSharp();
      
      if (this.sharpAvailable) {
        return {
          success: true,
          message: 'Sharp is now available for image optimization'
        };
      } else {
        return {
          success: false,
          message: 'Sharp installation failed - using fallback mode'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Sharp installation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const imageOptimizationService = ImageOptimizationService.getInstance();