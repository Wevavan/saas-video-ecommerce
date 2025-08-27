// src/routes/audio.routes.ts
import { Router, Request, Response } from 'express';
// Import corrigé pour express-validator

import { authenticateToken } from '../middleware/auth.middleware';
import { elevenLabsService } from '../services/elevenlabs.service';
import { TextToSpeechRequest, VoicePreset, VOICE_PRESETS } from '../types/audio/elevenlabs.types';
import { logError, logInfo } from '../config/logger.config';

const router = Router();
const { body, validationResult } = require('express-validator');

// Validation middleware pour la génération audio
const validateAudioGeneration = [
  body('text')
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
  
  body('voiceId')
    .isString()
    .notEmpty()
    .withMessage('Voice ID is required'),
  
  body('settings.stability')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Stability must be between 0 and 1'),
  
  body('settings.similarity_boost')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Similarity boost must be between 0 and 1'),
  
  body('settings.style')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Style must be between 0 and 1'),
  
  body('preset')
    .optional()
    .isIn(Object.keys(VOICE_PRESETS))
    .withMessage('Invalid voice preset'),
];

// POST /api/audio/generate - Génération audio principale
router.post('/generate', authenticateToken, validateAudioGeneration, async (req: Request, res: Response) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { text, voiceId, settings, preset, optimization } = req.body;
    const userId = (req as any).user.id;

    // Calculer le coût en crédits
    const estimatedCredits = Math.ceil(text.length / 50); // 1 crédit = ~50 caractères
    
    // Vérifier que l'utilisateur a suffisamment de crédits
    // (Cette logique sera intégrée avec votre système de crédits existant)
    
    // Appliquer le preset si spécifié
    let finalSettings = settings;
    if (preset && VOICE_PRESETS[preset as VoicePreset]) {
      finalSettings = {
        ...elevenLabsService.getVoicePreset(preset as VoicePreset),
        ...settings, // Les settings spécifiques surchargent le preset
      };
    }

    // Préparer la requête
    const audioRequest: TextToSpeechRequest = {
      text: text.trim(),
      voiceId,
      settings: finalSettings,
      optimization,
    };

    logInfo('Audio generation requested', {
      userId,
      textLength: text.length,
      voiceId,
      estimatedCredits,
    });

    // Générer l'audio
    const result = await elevenLabsService.generateSpeech(audioRequest);

    if (result.success) {
      // TODO: Déduire les crédits de l'utilisateur
      // await creditsService.deductCredits(userId, result.creditsUsed, 'audio_generation');

      logInfo('Audio generation successful', {
        userId,
        duration: result.duration,
        fileSize: result.fileSize,
        creditsUsed: result.creditsUsed,
      });

      res.json({
        success: true,
        data: {
          audioUrl: result.audioUrl,
          duration: result.duration,
          fileSize: result.fileSize,
          charactersUsed: result.charactersUsed,
          creditsUsed: result.creditsUsed,
          voiceUsed: result.voiceUsed,
        },
      });
    } else {
      logError('Audio generation failed', new Error(result.error || 'Unknown error'), {
        userId,
        textLength: text.length,
        voiceId,
      });

      res.status(500).json({
        success: false,
        error: result.error || 'Audio generation failed',
      });
    }

  } catch (error) {
    logError('Audio generation endpoint error', error as Error, {
      userId: (req as any).user?.id,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during audio generation',
    });
  }
});

// GET /api/audio/voices - Liste des voix disponibles
router.get('/voices', authenticateToken, async (req: Request, res: Response) => {
  try {
    const voices = await elevenLabsService.getAvailableVoices();
    
    res.json({
      success: true,
      data: {
        voices,
        presets: Object.keys(VOICE_PRESETS).map(key => ({
          name: key,
          settings: VOICE_PRESETS[key as VoicePreset],
          description: getPresetDescription(key as VoicePreset),
        })),
      },
    });
  } catch (error) {
    logError('Failed to get available voices', error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available voices',
    });
  }
});

// GET /api/audio/health - Santé du service ElevenLabs
router.get('/health', authenticateToken, async (req: Request, res: Response) => {
  try {
    const health = await elevenLabsService.getServiceHealth();
    
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logError('Failed to get ElevenLabs health', error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check service health',
    });
  }
});

// GET /api/audio/metrics - Métriques du service audio
router.get('/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const metrics = elevenLabsService.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logError('Failed to get audio metrics', error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
    });
  }
});

// POST /api/audio/test - Endpoint de test avec texte court
router.post('/test', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { voiceId = 'ENGLISH_FEMALE_1', text = 'Hello, this is a test of the audio generation system.' } = req.body;
    
    const testRequest: TextToSpeechRequest = {
      text,
      voiceId,
      settings: elevenLabsService.getVoicePreset('PROFESSIONAL'),
    };

    const result = await elevenLabsService.generateSpeech(testRequest);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Audio test completed successfully',
        data: {
          audioUrl: result.audioUrl,
          duration: result.duration,
          voiceUsed: result.voiceUsed,
          charactersUsed: result.charactersUsed,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Audio test failed',
      });
    }
  } catch (error) {
    logError('Audio test failed', error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Audio test endpoint error',
    });
  }
});

// POST /api/audio/preview - Prévisualisation rapide (texte court, pas de cache)
router.post('/preview', authenticateToken, [
  body('text')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Preview text must be between 1 and 200 characters'),
  body('voiceId')
    .isString()
    .notEmpty()
    .withMessage('Voice ID is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { text, voiceId } = req.body;
    
    const previewRequest: TextToSpeechRequest = {
      text: text.trim(),
      voiceId,
      settings: elevenLabsService.getVoicePreset('CONVERSATIONAL'),
      // Pas de cache pour les previews
      cacheKey: `preview_${Date.now()}_${Math.random()}`,
    };

    const result = await elevenLabsService.generateSpeech(previewRequest);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          audioUrl: result.audioUrl,
          duration: result.duration,
          message: 'Preview generated - this is a temporary file',
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Preview generation failed',
      });
    }
  } catch (error) {
    logError('Audio preview failed', error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Preview generation error',
    });
  }
});

// POST /api/audio/cleanup - Nettoyage des fichiers anciens (admin)
router.post('/cleanup', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Vérifier que l'utilisateur est admin
    // if (!req.user.isAdmin) { return res.status(403).json({ error: 'Admin required' }); }
    
    await elevenLabsService.cleanupOldAudioFiles();
    
    res.json({
      success: true,
      message: 'Audio cleanup completed successfully',
    });
  } catch (error) {
    logError('Audio cleanup failed', error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Cleanup operation failed',
    });
  }
});

// GET /api/audio/estimate - Estimation du coût en crédits
router.post('/estimate', authenticateToken, [
  body('text')
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { text } = req.body;
    const charactersCount = text.length;
    const wordsCount = text.split(/\s+/).length;
    const estimatedCredits = Math.ceil(charactersCount / 50);
    const estimatedDuration = Math.max(1, wordsCount * 0.5); // ~0.5s par mot

    res.json({
      success: true,
      data: {
        charactersCount,
        wordsCount,
        estimatedCredits,
        estimatedDuration,
        costBreakdown: {
          characters: charactersCount,
          creditsPerCharacter: 1/50,
          totalCredits: estimatedCredits,
        },
      },
    });
  } catch (error) {
    logError('Cost estimation failed', error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Cost estimation error',
    });
  }
});

// Fonction helper pour les descriptions des presets
function getPresetDescription(preset: VoicePreset): string {
  const descriptions = {
    COMMERCIAL: 'Optimisé pour les publicités et contenus marketing. Voix claire, engageante et professionnelle.',
    NARRATIVE: 'Parfait pour les narrations et storytelling. Voix stable et expressive pour captiver l\'audience.',
    CONVERSATIONAL: 'Idéal pour les dialogues et conversations. Ton naturel et accessible.',
    PROFESSIONAL: 'Pour les présentations et contenus corporate. Voix autoritaire et crédible.',
  };
  
  return descriptions[preset] || 'Configuration personnalisée';
}

export default router;