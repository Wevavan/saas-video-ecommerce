// backend/src/services/runway.service.ts (corrections sur votre code existant)
import axios, { AxiosResponse } from 'axios';
import { RunwayGenerationRequest, RunwayResponse, VideoGenerationStatus, RunwayConfig } from '../types/runway.types';
import { Video } from '../models/Video.model';
import { CreditsService } from './credits.service';

export class RunwayService {
  // ✅ CORRECTION 1: URL mise à jour vers la bonne API
  private static config: RunwayConfig = {
    apiKey: process.env.RUNWAY_API_KEY || '',
    baseUrl: process.env.RUNWAY_API_URL || 'https://api.dev.runwayml.com/v1',
    timeout: 30000,
    maxRetries: 3,
    pollingInterval: 10000
  };

  static async generateVideo(
    userId: string,
    videoId: string,
    request: RunwayGenerationRequest
  ): Promise<RunwayResponse> {
    console.log('🎬 Début génération Runway:', { userId, videoId, request });
    
    // ✅ AJOUT DEBUG: Vérifier la configuration
    console.log('🔍 Configuration:', {
      apiKey: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey?.length,
      baseUrl: this.config.baseUrl
    });

    try {
      this.validateConfig();

      const creditCost = this.calculateCreditCost(request);
      const hasSufficientCredits = await CreditsService.checkSufficientCredits(userId, creditCost);
      
      if (!hasSufficientCredits) {
        throw new Error(`Crédits insuffisants. Requis: ${creditCost} crédits`);
      }

      const runwayPayload = this.formatRunwayRequest(request);
      
      // ✅ SOLUTION: Convertir l'image locale en base64
      if (request.imageUrl.includes('localhost') || request.imageUrl.includes('127.0.0.1')) {
        console.log('🔄 Conversion image locale en base64...');
        try {
          const imageBase64 = await this.convertImageToBase64(request.imageUrl);
          runwayPayload.promptImage = imageBase64;
          console.log('✅ Image convertie en base64');
        } catch (error: any) {
          console.error('❌ Erreur conversion base64:', error.message);
          throw new Error('Impossible de traiter l\'image locale');
        }
      }
      
      // ✅ AJOUT DEBUG: Voir le payload envoyé
      console.log('🔍 Payload envoyé à Runway:', JSON.stringify({
        ...runwayPayload,
        promptImage: runwayPayload.promptImage.startsWith('data:') 
          ? 'data:image/...[BASE64_ENCODED]' 
          : runwayPayload.promptImage
      }, null, 2));
      
      // ✅ CORRECTION 2: Bon endpoint pour la nouvelle API
      const response = await this.callRunwayAPI('/image_to_video', runwayPayload, 'POST');
      
      console.log('✅ Réponse Runway reçue:', response.data);

      const runwayResponse: RunwayResponse = {
        id: response.data.id || `runway_${Date.now()}`,
        status: this.mapRunwayStatus(response.data.status),
        progress: response.data.progress || 0,
        createdAt: new Date(),
        metadata: {
          runwayJobId: response.data.id,
          originalRequest: request,
          estimatedDuration: response.data.estimatedDuration || 120
        }
      };

      await Video.findByIdAndUpdate(videoId, {
        status: 'processing',
        runwayJobId: runwayResponse.id,
        generationStartedAt: new Date(),
        metadata: {
          creditCost,
          runwayJobId: runwayResponse.id,
          ...runwayResponse.metadata
        }
      });

      await CreditsService.consumeCredits(userId, {
        amount: creditCost,
        reason: 'Génération vidéo Runway',
        metadata: {
          videoId,
          runwayJobId: runwayResponse.id,
          style: request.style,
          creditCost
        }
      });

      console.log('✅ Vidéo en cours de génération:', runwayResponse.id);
      return runwayResponse;

    } catch (error: any) {
      console.error('❌ Erreur génération Runway:', error.message);
      
      await Video.findByIdAndUpdate(videoId, {
        status: 'failed',
        error: error.message,
        generationEndedAt: new Date()
      });

      throw new Error(`Génération vidéo échouée: ${error.message}`);
    }
  }

  static async checkGenerationStatus(runwayJobId: string): Promise<RunwayResponse> {
    try {
      console.log('🔍 Vérification statut Runway:', runwayJobId);

      const response = await this.callRunwayAPI(`/tasks/${runwayJobId}`);
      const data = response.data;

      const status: RunwayResponse = {
        id: runwayJobId,
        status: this.mapRunwayStatus(data.status),
        progress: data.progress || 0,
        createdAt: new Date(data.createdAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        videoUrl: data.output?.videoUrl,
        thumbnailUrl: data.output?.thumbnailUrl,
        error: data.error,
        metadata: data
      };

      console.log('📊 Statut récupéré:', {
        id: status.id,
        status: status.status,
        progress: status.progress
      });

      return status;

    } catch (error: any) {
      console.error('❌ Erreur vérification statut:', error.message);
      
      return {
        id: runwayJobId,
        status: VideoGenerationStatus.FAILED,
        createdAt: new Date(),
        error: error.message
      };
    }
  }

  static async cancelGeneration(runwayJobId: string): Promise<boolean> {
    try {
      console.log('🛑 Annulation génération:', runwayJobId);
      await this.callRunwayAPI(`/tasks/${runwayJobId}/cancel`, {}, 'POST');
      console.log('✅ Génération annulée');
      return true;
    } catch (error: any) {
      console.error('❌ Erreur annulation:', error.message);
      return false;
    }
  }

  static getAvailableStyles(): string[] {
    return [
      'cinematic', 'realistic', 'artistic', 'fast_motion', 'slow_motion',
      'dreamy', 'vintage', 'modern', 'professional', 'creative'
    ];
  }

  private static validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('RUNWAY_API_KEY non configurée');
    }
    if (!this.config.baseUrl) {
      throw new Error('RUNWAY_API_URL non configurée');
    }
  }

  private static calculateCreditCost(request: RunwayGenerationRequest): number {
    let baseCost = 10;
    
    if (request.duration && request.duration > 10) {
      baseCost += Math.ceil((request.duration - 10) / 5) * 2;
    }

    const premiumStyles = ['cinematic', 'artistic', 'professional'];
    if (premiumStyles.includes(request.style)) {
      baseCost += 5;
    }

    return baseCost;
  }

  // ✅ CORRECTION 3: Format de requête avec support base64
  private static formatRunwayRequest(request: RunwayGenerationRequest): any {
    return {
      promptImage: request.imageUrl, // Peut être une URL ou base64 data:image/...
      promptText: request.prompt,
      model: 'gen4_turbo',
      ratio: request.aspectRatio === '16:9' ? '1280:720' : '720:1280',
      duration: request.duration || 5,
      seed: request.seed || Math.floor(Math.random() * 1000000)
    };
  }

  private static async callRunwayAPI(
    endpoint: string, 
    data?: any, 
    method: 'GET' | 'POST' = 'GET'
  ): Promise<AxiosResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${this.config.maxRetries} - ${method} ${url}`);

        const config = {
          method,
          url,
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'X-Runway-Version': '2024-11-06', // ✅ CORRECTION 4: Header requis
            'User-Agent': 'SaaS-Video-Ecommerce/1.0'
          },
          timeout: this.config.timeout,
          ...(data && { data })
        };

        const response = await axios(config);
        console.log(`✅ Succès API Runway - Status: ${response.status}`);
        return response;

      } catch (error: any) {
        console.error(`❌ Tentative ${attempt} échouée:`, error.message);
        
        // ✅ AJOUT DEBUG: Voir l'erreur complète
        if (error.response) {
          console.error('🔍 Status:', error.response.status);
          console.error('🔍 Headers:', error.response.headers);
          console.error('🔍 Data:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (attempt === this.config.maxRetries) {
          if (error.response) {
            const errorMessage = error.response.data?.error || error.response.data?.message || error.message;
            throw new Error(`API Runway error: ${error.response.status} - ${errorMessage}`);
          }
          throw new Error(`Connexion Runway échouée: ${error.message}`);
        }

        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Attente ${waitTime}ms avant retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Toutes les tentatives ont échoué');
  }

  private static mapRunwayStatus(runwayStatus: string): VideoGenerationStatus {
    const statusMap: { [key: string]: VideoGenerationStatus } = {
      'pending': VideoGenerationStatus.QUEUED,
      'queued': VideoGenerationStatus.QUEUED,
      'running': VideoGenerationStatus.PROCESSING,
      'processing': VideoGenerationStatus.PROCESSING,
      'completed': VideoGenerationStatus.COMPLETED,
      'succeeded': VideoGenerationStatus.COMPLETED,
      'failed': VideoGenerationStatus.FAILED,
      'error': VideoGenerationStatus.FAILED,
      'cancelled': VideoGenerationStatus.FAILED,
      'timeout': VideoGenerationStatus.TIMEOUT
    };

    return statusMap[runwayStatus?.toLowerCase()] || VideoGenerationStatus.FAILED;
  }

  static async getServiceStats(): Promise<any> {
    try {
      const stats = await Video.aggregate([
        {
          $match: {
            runwayJobId: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: {
              $avg: {
                $cond: [
                  { $and: ['$generationStartedAt', '$generationEndedAt'] },
                  {
                    $divide: [
                      { $subtract: ['$generationEndedAt', '$generationStartedAt'] },
                      1000
                    ]
                  },
                  null
                ]
              }
            }
          }
        }
      ]);

      return {
        totalGenerations: stats.reduce((sum, stat) => sum + stat.count, 0),
        statusBreakdown: stats,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Erreur stats service:', error);
      return {
        error: 'Impossible de récupérer les statistiques',
        timestamp: new Date()
      };
    }
  }

  // ✅ NOUVELLE MÉTHODE: Conversion d'image locale en base64 avec validation
  private static async convertImageToBase64(imageUrl: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Extraire le nom de fichier de l'URL
      const filename = imageUrl.split('/').pop();
      if (!filename) {
        throw new Error('Nom de fichier introuvable dans l\'URL');
      }
      
      // Chemin vers le fichier local
      const filepath = path.join(process.cwd(), 'uploads', filename);
      console.log('🔍 Lecture fichier:', filepath);
      
      // Vérifier que le fichier existe
      try {
        await fs.access(filepath);
      } catch (error) {
        throw new Error(`Fichier non trouvé: ${filepath}`);
      }
      
      // Lire le fichier
      const imageBuffer = await fs.readFile(filepath);
      console.log('🔍 Taille fichier:', imageBuffer.length, 'bytes');
      
      // Déterminer le type MIME
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      };
      
      const mimeType = mimeTypes[ext] || 'image/jpeg';
      console.log('🔍 Type MIME détecté:', mimeType);
      
      // Vérifier que l'image n'est pas trop grande pour data URI (limite Runway: 5MB)
      const dataUriSizeLimit = 5 * 1024 * 1024; // 5MB en bytes
      if (imageBuffer.length > 3.3 * 1024 * 1024) { // 3.3MB car base64 ajoute ~33%
        throw new Error('Image trop grande pour data URI (max ~3.3MB car base64 ajoute 33%)');
      }
      
      // Convertir en base64
      const base64 = imageBuffer.toString('base64');
      console.log('🔍 Taille base64:', base64.length, 'caractères');
      
      const dataUri = `data:${mimeType};base64,${base64}`;
      console.log('🔍 Data URI créé, longueur totale:', dataUri.length);
      
      return dataUri;
      
    } catch (error: any) {
      console.error('❌ Erreur conversion base64:', error.message);
      throw new Error(`Impossible de convertir l'image: ${error.message}`);
    }
  }
}