import { Job } from 'bull';
import { VideoGenerationJobData, JobProgress } from '../types/queue.types';
import { queueService } from '../services/queue.service';
import { openaiService } from '../services/openai.service';
import { elevenlabsService } from '../services/elevenlabs.service';
import { RunwayService } from '../services/runway.service';
import { videoAssemblyService } from '../services/videoAssembly.service';
import { CreditsService } from '../services/credits.service';
import { Video } from '../models/Video.model';
import { RunwayGenerationRequest } from '../types/runway.types';

export async function videoGenerationWorker(job: Job<VideoGenerationJobData>) {
  const { id: jobId, userId, imageUrl, productInfo, style, voiceSettings, duration } = job.data;

  try {
    // Étape 1: Validation (5%)
    await updateProgress(jobId, 5, 'validation', 'Validation des données...');
    await validateJobData(job.data);

    // Créer l'entrée vidéo en base
    const video = new Video({
      userId,
      title: `${productInfo.name} - Video Marketing`,
      description: `Vidéo marketing générée pour ${productInfo.name}`,
      style,
      status: 'processing',
      inputImage: imageUrl,
      duration,
      jobId,
      createdAt: new Date(),
      generationStartedAt: new Date(),
    });
    
    await video.save();

    // Étape 2: Génération du script (25%)
    await updateProgress(jobId, 25, 'script_generation', 'Génération du script marketing avec IA...');
    const script = await openaiService.generateMarketingScript(productInfo, style, duration);
    console.log('📝 Script généré:', script.substring(0, 100) + '...');
    
    // Étape 3: Génération de la voix-off (50%)
    await updateProgress(jobId, 50, 'voice_generation', 'Génération de la voix-off...');
    const audioPath = await elevenlabsService.generateSpeech(script, voiceSettings.voiceId, voiceSettings);
    console.log('🎤 Audio généré:', audioPath);

    // Étape 4: Génération vidéo avec Runway (75%)
    await updateProgress(jobId, 75, 'video_generation', 'Génération de la vidéo avec IA...');
    
    const runwayRequest: RunwayGenerationRequest = {
      imageUrl,
      prompt: script,
      style: style as any,
      duration,
      aspectRatio: '9:16', // Format vertical pour réseaux sociaux
      seed: Math.floor(Math.random() * 1000000)
    };

    const runwayResponse = await RunwayService.generateVideo(
      userId,
      video._id.toString(),
      runwayRequest
    );

    // Polling pour attendre la fin de génération Runway
    let videoPath = '';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10s
      
      const status = await RunwayService.checkGenerationStatus(runwayResponse.id);
      
      if (status.status === 'completed' && status.videoUrl) {
        videoPath = status.videoUrl;
        break;
      } else if (status.status === 'failed') {
        throw new Error(`Génération Runway échouée: ${status.error}`);
      }
      
      attempts++;
      const progressPercent = Math.min(85, 75 + (attempts / maxAttempts) * 10);
      await updateProgress(jobId, progressPercent, 'video_generation', `Génération en cours... (${attempts}/${maxAttempts})`);
    }

    if (!videoPath) {
      throw new Error('Timeout génération Runway après 5 minutes');
    }

    // Étape 5: Assemblage final (95%)
    await updateProgress(jobId, 95, 'assembly', 'Assemblage final de la vidéo...');
    const finalVideoPath = await videoAssemblyService.combineVideoAudio(videoPath, audioPath, style);
    
    // Optimisation web
    const optimizedVideoPath = await videoAssemblyService.optimizeForWeb(finalVideoPath);

    // Étape 6: Finalisation (100%)
    await updateProgress(jobId, 100, 'completed', 'Vidéo générée avec succès !');
    
    // Mettre à jour la vidéo en base
    await Video.findByIdAndUpdate(video._id, {
      status: 'completed',
      outputVideo: optimizedVideoPath,
      script,
      generationEndedAt: new Date(),
      runwayJobId: runwayResponse.id,
      metadata: {
        creditCost: calculateCreditsUsed(duration, style),
        generationTime: Date.now() - video.createdAt.getTime(),
        audioPath,
        originalVideoPath: videoPath,
        finalVideoPath: optimizedVideoPath
      }
    });

    console.log('✅ Génération vidéo terminée avec succès!');

    return {
      success: true,
      videoId: video._id,
      videoUrl: optimizedVideoPath,
      script,
      duration,
      creditsUsed: calculateCreditsUsed(duration, style),
      generationTime: Date.now() - video.createdAt.getTime()
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Job ${jobId} failed:`, errorMessage);
    
    // Rollback des crédits si erreur
    try {
      await CreditsService.addCredits({
        userId,
        amount: calculateCreditsUsed(duration, style),
        source: 'refund',
        metadata: { jobId, reason: 'rollback_failed_generation' }
      });
      console.log('💰 Crédits remboursés après échec');
    } catch (rollbackError: unknown) {
      const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error';
      console.error('❌ Failed to rollback credits:', rollbackMessage);
    }

    // Mettre à jour la vidéo en base comme échouée
    try {
      await Video.updateOne(
        { jobId },
        { 
          status: 'failed', 
          error: errorMessage,
          generationEndedAt: new Date()
        }
      );
    } catch (dbError) {
      console.error('❌ Erreur mise à jour DB:', dbError);
    }

    // Log de l'erreur dans le progress
    queueService.updateJobProgress(jobId, {
      percentage: 0,
      stage: 'validation',
      message: `Erreur: ${errorMessage}`,
      logs: [...(queueService.getJobProgress(jobId)?.logs || []), {
        timestamp: new Date(),
        level: 'error',
        message: `Job failed: ${errorMessage}`,
        data: { stack: error instanceof Error ? error.stack : 'No stack trace' }
      }]
    });

    throw error;
  }
}

async function updateProgress(jobId: string, percentage: number, stage: any, message: string) {
  const estimatedTimeRemaining = Math.max(0, Math.round((100 - percentage) * 3)); // ~5min total
  
  queueService.updateJobProgress(jobId, {
    percentage,
    stage,
    message,
    estimatedTimeRemaining,
    logs: [...(queueService.getJobProgress(jobId)?.logs || []), {
      timestamp: new Date(),
      level: 'info',
      message: `${stage}: ${message}`,
      data: { percentage }
    }]
  });

  console.log(`📊 Progress ${jobId}: ${percentage}% - ${message}`);
}

async function validateJobData(data: VideoGenerationJobData) {
  if (!data.userId || !data.imageUrl || !data.productInfo.name) {
    throw new Error('Données manquantes pour la génération');
  }

  // Vérifier que l'utilisateur a suffisamment de crédits
  const creditsNeeded = calculateCreditsUsed(data.duration, data.style);
  const hasCredits = await CreditsService.checkSufficientCredits(data.userId, creditsNeeded);
  
  if (!hasCredits) {
    throw new Error(`Crédits insuffisants. Requis: ${creditsNeeded} crédits`);
  }

  console.log(`✅ Validation OK - Crédits requis: ${creditsNeeded}`);
}

function calculateCreditsUsed(duration: number, style: string): number {
  const baseCredits = Math.ceil(duration / 10) * 5; // 5 crédits par tranche de 10s
  const styleMultiplier = style === 'luxe' ? 1.5 : 1;
  return Math.ceil(baseCredits * styleMultiplier);
}