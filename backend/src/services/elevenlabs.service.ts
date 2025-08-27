// src/services/elevenlabs.service.ts
import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { 
  AudioGenerationConfig, 
  AudioGenerationResult, 
  VoiceSettings, 
  SupportedVoices, 
  VoiceInfo, 
  CachedAudio,
  ElevenLabsServiceHealth,
  AudioOptimizationSettings,
  TextToSpeechRequest,
  AudioMetrics,
  VOICE_PRESETS,
  VoicePreset
} from '../types/audio/elevenlabs.types';
import { cacheService } from './cache.service';
import { logError, logInfo, logWarn } from '../config/logger.config';

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private client: ElevenLabsClient | null = null;
  private audioDir: string;
  private isConfigured: boolean = false;
  private metrics: AudioMetrics;
  private lastHealthCheck: Date | null = null;
  private errorCount: number = 0;

  private constructor() {
    this.audioDir = path.join(process.env.UPLOAD_PATH || './uploads', 'audio');
    this.metrics = {
      totalGenerations: 0,
      totalCharacters: 0,
      totalCreditsUsed: 0,
      averageDuration: 0,
      cacheHitRate: 0,
      popularVoices: {},
      errorRate: 0,
    };
    
    this.initializeService();
    this.ensureAudioDirectory();
  }

  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        logWarn('ElevenLabs API key not configured');
        return;
      }

      this.client = new ElevenLabsClient({
        apiKey: apiKey,
      });

      this.isConfigured = true;
      logInfo('ElevenLabs service initialized successfully');

      // Test de connectivité
      await this.testConnection();
      
    } catch (error) {
      logError('Failed to initialize ElevenLabs service', error as Error);
      this.isConfigured = false;
    }
  }

  private async ensureAudioDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      logInfo('Audio directory ensured', { path: this.audioDir });
    } catch (error) {
      logError('Failed to create audio directory', error as Error);
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;

      const voices = await this.client.voices.getAll();
      logInfo('ElevenLabs connection test successful', { 
        voicesCount: voices.voices?.length || 0 
      });
      return true;
    } catch (error) {
      logError('ElevenLabs connection test failed', error as Error);
      this.errorCount++;
      return false;
    }
  }

  // Génération de speech principal
  async generateSpeech(request: TextToSpeechRequest): Promise<AudioGenerationResult> {
    const startTime = Date.now();

    try {
      if (!this.isConfigured || !this.client) {
        return {
          success: false,
          charactersUsed: request.text.length,
          creditsUsed: 0,
          voiceUsed: request.voiceId,
          error: 'ElevenLabs service not configured'
        };
      }

      // Validation du texte
      const validation = this.validateText(request.text);
      if (!validation.valid) {
        return {
          success: false,
          charactersUsed: request.text.length,
          creditsUsed: 0,
          voiceUsed: request.voiceId,
          error: validation.error
        };
      }

      // Vérifier le cache
      const cacheKey = request.cacheKey || this.generateCacheKey(request.text, request.voiceId, request.settings);
      const cached = await this.getCachedAudio(cacheKey);
      
      if (cached) {
        logInfo('Audio cache hit', { cacheKey, textLength: request.text.length });
        this.updateMetrics(request, cached.duration, true);
        
        return {
          success: true,
          audioUrl: cached.audioUrl,
          audioPath: cached.audioPath,
          duration: cached.duration,
          fileSize: cached.fileSize,
          charactersUsed: request.text.length,
          creditsUsed: this.calculateCredits(request.text.length),
          voiceUsed: request.voiceId,
        };
      }

      // Configuration de la voix
      const voiceSettings = this.prepareVoiceSettings(request.settings);
      const voiceId = this.resolveVoiceId(request.voiceId);

      logInfo('Generating speech with ElevenLabs', {
        textLength: request.text.length,
        voiceId,
        settings: voiceSettings,
      });

      // Génération audio
      const audioStream = await this.client.generate({
        voice: voiceId,
        text: request.text,
        voice_settings: voiceSettings,
        model_id: 'eleven_multilingual_v2', // Modèle multilingue
      });

      // Conversion du stream en buffer
      const audioBuffer = await this.streamToBuffer(audioStream);
      
      // Sauvegarde du fichier
      const filename = `audio_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.mp3`;
      const audioPath = path.join(this.audioDir, filename);
      const audioUrl = `/uploads/audio/${filename}`;
      
      await fs.writeFile(audioPath, audioBuffer);

      // Optimisation audio si demandée
      let finalAudioPath = audioPath;
      let finalAudioUrl = audioUrl;
      
      if (request.optimization) {
        const optimized = await this.optimizeAudio(audioPath, request.optimization);
        if (optimized.success) {
          finalAudioPath = optimized.path!;
          finalAudioUrl = optimized.url!;
        }
      }

      // Calculs des métriques
      const fileStats = await fs.stat(finalAudioPath);
      const duration = await this.getAudioDuration(finalAudioPath);
      const charactersUsed = request.text.length;
      const creditsUsed = this.calculateCredits(charactersUsed);

      // Mise en cache
      const cacheData: CachedAudio = {
        audioPath: finalAudioPath,
        audioUrl: finalAudioUrl,
        duration,
        fileSize: fileStats.size,
        voiceId,
        text: request.text,
        textHash: this.hashText(request.text),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      };

      await this.cacheAudio(cacheKey, cacheData);

      // Mise à jour des métriques
      this.updateMetrics(request, duration, false);

      const processingTime = Date.now() - startTime;
      logInfo('Speech generation completed', {
        processingTime,
        duration,
        fileSize: fileStats.size,
        charactersUsed,
        creditsUsed,
      });

      return {
        success: true,
        audioUrl: finalAudioUrl,
        audioPath: finalAudioPath,
        duration,
        fileSize: fileStats.size,
        charactersUsed,
        creditsUsed,
        voiceUsed: voiceId,
      };

    } catch (error) {
      this.errorCount++;
      const processingTime = Date.now() - startTime;
      
      logError('Speech generation failed', error as Error, {
        processingTime,
        textLength: request.text.length,
        voiceId: request.voiceId,
      });

      return {
        success: false,
        charactersUsed: request.text.length,
        creditsUsed: 0,
        voiceUsed: request.voiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Méthodes utilitaires
  private validateText(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'Text cannot be empty' };
    }

    if (text.length > 5000) {
      return { valid: false, error: 'Text exceeds maximum length of 5000 characters' };
    }

    // Vérifier les caractères spéciaux problématiques
    const problematicChars = /[^\w\s\.,\?!\-\'\"\(\)\[\]:;]/g;
    if (problematicChars.test(text)) {
      logWarn('Text contains potentially problematic characters', { text: text.substring(0, 100) });
    }

    return { valid: true };
  }

  private prepareVoiceSettings(settings?: Partial<VoiceSettings>): VoiceSettings {
    const defaultSettings: VoiceSettings = {
      stability: 0.75,
      similarity_boost: 0.85,
      style: 0.2,
      use_speaker_boost: true,
    };

    return {
      ...defaultSettings,
      ...settings,
    };
  }

  private resolveVoiceId(voiceId: string): string {
    // Si c'est déjà un ID de voix, le retourner
    if (voiceId.length > 10 && !voiceId.includes('_')) {
      return voiceId;
    }

    // Résoudre depuis l'enum
    const enumValue = SupportedVoices[voiceId as keyof typeof SupportedVoices];
    if (enumValue) {
      return enumValue;
    }

    // Fallback sur voix par défaut
    logWarn('Unknown voice ID, using default', { requestedVoice: voiceId });
    return SupportedVoices.ENGLISH_FEMALE_1;
  }

  private generateCacheKey(text: string, voiceId: string, settings?: Partial<VoiceSettings>): string {
    const textHash = this.hashText(text);
    const settingsHash = settings ? this.hashText(JSON.stringify(settings)) : 'default';
    return `elevenlabs:${voiceId}:${textHash}:${settingsHash}`;
  }

  private hashText(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  private calculateCredits(charactersUsed: number): number {
    // 1 crédit = 10 mots approximativement (5 caractères par mot moyen)
    return Math.ceil(charactersUsed / 50);
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      // Estimation basique basée sur la taille du fichier
      // En production, utilisez ffprobe pour une durée précise
      const stats = await fs.stat(audioPath);
      const estimatedDuration = stats.size / (128 * 1024 / 8); // 128kbps approximatif
      return Math.max(1, estimatedDuration);
    } catch (error) {
      logWarn('Failed to get audio duration', { error: (error as Error).message });
      return 1; // Durée par défaut
    }
  }

  private async optimizeAudio(audioPath: string, settings: AudioOptimizationSettings): Promise<{
    success: boolean;
    path?: string;
    url?: string;
    error?: string;
  }> {
    try {
      // Pour l'instant, retourner le fichier original
      // En production, utilisez ffmpeg pour l'optimisation
      const filename = path.basename(audioPath);
      const optimizedPath = audioPath.replace('.mp3', '_optimized.mp3');
      const optimizedUrl = `/uploads/audio/${filename.replace('.mp3', '_optimized.mp3')}`;
      
      // Copie simple pour l'instant
      await fs.copyFile(audioPath, optimizedPath);
      
      return {
        success: true,
        path: optimizedPath,
        url: optimizedUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Optimization failed',
      };
    }
  }

  // Gestion du cache
  private async getCachedAudio(cacheKey: string): Promise<CachedAudio | null> {
    try {
      const cached = await cacheService.get<CachedAudio>(`audio:${cacheKey}`);
      
      if (cached && new Date() < new Date(cached.expiresAt)) {
        // Vérifier que le fichier existe toujours
        try {
          await fs.access(cached.audioPath);
          return cached;
        } catch {
          // Fichier n'existe plus, supprimer du cache
          await cacheService.del(`audio:${cacheKey}`);
        }
      }
      
      return null;
    } catch (error) {
      logError('Failed to get cached audio', error as Error);
      return null;
    }
  }

  private async cacheAudio(cacheKey: string, cacheData: CachedAudio): Promise<void> {
    try {
      const ttl = 7 * 24 * 60 * 60; // 7 jours
      await cacheService.set(`audio:${cacheKey}`, cacheData, { ttl });
      logInfo('Audio cached successfully', { cacheKey, duration: cacheData.duration });
    } catch (error) {
      logError('Failed to cache audio', error as Error);
    }
  }

  private updateMetrics(request: TextToSpeechRequest, duration: number, fromCache: boolean): void {
    this.metrics.totalGenerations++;
    this.metrics.totalCharacters += request.text.length;
    this.metrics.totalCreditsUsed += this.calculateCredits(request.text.length);
    
    // Mise à jour de la durée moyenne
    this.metrics.averageDuration = (this.metrics.averageDuration + duration) / 2;
    
    // Mise à jour du taux de cache hit
    const cacheHits = fromCache ? 1 : 0;
    this.metrics.cacheHitRate = (this.metrics.cacheHitRate + cacheHits) / 2;
    
    // Voiz populaires
    const voiceId = this.resolveVoiceId(request.voiceId);
    this.metrics.popularVoices[voiceId] = (this.metrics.popularVoices[voiceId] || 0) + 1;
    
    // Taux d'erreur
    this.metrics.errorRate = this.errorCount / this.metrics.totalGenerations;
  }

  // API publique
  async getAvailableVoices(): Promise<VoiceInfo[]> {
    const voices: VoiceInfo[] = [
      {
        voice_id: SupportedVoices.FRENCH_MALE_1,
        name: 'Adam (Français)',
        language: 'French',
        gender: 'male',
        accent: 'French',
        description: 'Voix masculine française, claire et professionnelle',
        use_case: ['commercial', 'narrative', 'professional'],
      },
      {
        voice_id: SupportedVoices.FRENCH_FEMALE_1,
        name: 'Bella (Français)',
        language: 'French',
        gender: 'female',
        accent: 'French',
        description: 'Voix féminine française, douce et engageante',
        use_case: ['commercial', 'conversational'],
      },
      {
        voice_id: SupportedVoices.ENGLISH_MALE_1,
        name: 'Adam (English)',
        language: 'English',
        gender: 'male',
        accent: 'American',
        description: 'Clear American male voice, professional tone',
        use_case: ['commercial', 'professional', 'narrative'],
      },
      {
        voice_id: SupportedVoices.ENGLISH_FEMALE_1,
        name: 'Bella (English)',
        language: 'English',
        gender: 'female',
        accent: 'American',
        description: 'Warm American female voice, engaging and friendly',
        use_case: ['commercial', 'conversational'],
      },
      {
        voice_id: SupportedVoices.SPANISH_MALE_1,
        name: 'Antoni (Español)',
        language: 'Spanish',
        gender: 'male',
        accent: 'Spanish',
        description: 'Voz masculina española, expresiva y natural',
        use_case: ['commercial', 'narrative'],
      },
    ];

    return voices;
  }

  async getServiceHealth(): Promise<ElevenLabsServiceHealth> {
    try {
      const connectionTest = await this.testConnection();
      this.lastHealthCheck = new Date();

      return {
        status: connectionTest ? 'healthy' : 'unhealthy',
        apiKeyConfigured: this.isConfigured,
        lastSuccessfulCall: connectionTest ? new Date() : undefined,
        errorCount: this.errorCount,
        responseTime: connectionTest ? 200 : undefined, // Approximation
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        apiKeyConfigured: this.isConfigured,
        errorCount: this.errorCount,
      };
    }
  }

  getMetrics(): AudioMetrics {
    return { ...this.metrics };
  }

  getVoicePreset(preset: VoicePreset): VoiceSettings {
    return { ...VOICE_PRESETS[preset] };
  }

  // Nettoyage des fichiers audio anciens
  async cleanupOldAudioFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.audioDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.audioDir, file);
        const stats = await fs.stat(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logInfo('Audio cleanup completed', { deletedFiles: deletedCount });
    } catch (error) {
      logError('Audio cleanup failed', error as Error);
    }
  }
}

export const elevenLabsService = ElevenLabsService.getInstance();