// backend/src/services/runway.polling.service.ts (version corrigée)
import * as cron from 'node-cron'; // ✅ Correction de l'import
import { Video } from '../models/Video.model';
import { RunwayService } from './runway.service';
import { VideoGenerationStatus } from '../types/runway.types';

export class RunwayPollingService {
  private static isRunning = false;
  private static cronJob: cron.ScheduledTask | null = null; // ✅ Correction du type
  private static stats = {
    totalPolled: 0,
    successfulUpdates: 0,
    errors: 0,
    lastPoll: null as Date | null,
    activeJobs: 0
  };

  static start(): void {
    if (this.isRunning) {
      console.log('⚠️ Runway polling déjà en cours');
      return;
    }

    console.log('🎬 Démarrage du service polling Runway...');
    
    this.cronJob = cron.schedule('*/10 * * * * *', async () => {
      await this.pollActiveJobs();
    });

    this.isRunning = true;
    console.log('✅ Service polling Runway démarré (toutes les 10s)');
  }

  static stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Runway polling déjà arrêté');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop(); // ✅ Correction: utiliser stop() au lieu de destroy()
      this.cronJob = null;
    }

    this.isRunning = false;
    console.log('🛑 Service polling Runway arrêté');
  }

  private static async pollActiveJobs(): Promise<void> {
    try {
      const activeVideos = await Video.find({
        status: 'processing',
        runwayJobId: { $exists: true },
        generationStartedAt: {
          $gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      });

      if (activeVideos.length === 0) {
        return;
      }

      console.log(`🔍 Polling ${activeVideos.length} job(s) Runway actif(s)`);
      
      this.stats.activeJobs = activeVideos.length;
      this.stats.lastPoll = new Date();

      const promises = activeVideos.map(video => this.pollSingleJob(video));
      await Promise.allSettled(promises);

      this.stats.totalPolled += activeVideos.length;

    } catch (error: any) {
      console.error('❌ Erreur polling général:', error.message);
      this.stats.errors++;
    }
  }

  private static async pollSingleJob(video: any): Promise<void> {
    try {
      console.log(`🎬 Polling job: ${video.runwayJobId} (Video: ${video._id})`);

      const status = await RunwayService.checkGenerationStatus(video.runwayJobId);
      
      switch (status.status) {
        case VideoGenerationStatus.COMPLETED:
          await this.handleCompletedJob(video, status);
          break;
          
        case VideoGenerationStatus.FAILED:
        case VideoGenerationStatus.TIMEOUT:
          await this.handleFailedJob(video, status);
          break;
          
        case VideoGenerationStatus.PROCESSING:
          await this.handleProcessingJob(video, status);
          break;
          
        default:
          console.log(`⏳ Job ${video.runwayJobId} toujours en attente...`);
      }

      this.stats.successfulUpdates++;

    } catch (error: any) {
      console.error(`❌ Erreur polling job ${video.runwayJobId}:`, error.message);
      this.stats.errors++;
      
      const startTime = new Date(video.generationStartedAt).getTime();
      const currentTime = Date.now();
      
      if (currentTime - startTime > 5 * 60 * 1000) {
        await this.handleTimeoutJob(video);
      }
    }
  }

  private static async handleCompletedJob(video: any, status: any): Promise<void> {
    console.log(`✅ Job complété: ${video.runwayJobId}`);
    
    await Video.findByIdAndUpdate(video._id, {
      status: 'completed',
      videoUrl: status.videoUrl,
      thumbnailUrl: status.thumbnailUrl,
      generationEndedAt: new Date(),
      progress: 100,
      metadata: {
        ...video.metadata,
        runwayResponse: status
      }
    });

    console.log(`🎉 Vidéo ${video._id} générée avec succès !`);
  }

  private static async handleFailedJob(video: any, status: any): Promise<void> {
    console.log(`❌ Job échoué: ${video.runwayJobId} - ${status.error}`);
    
    await Video.findByIdAndUpdate(video._id, {
      status: 'failed',
      error: status.error || 'Génération échouée',
      generationEndedAt: new Date(),
      metadata: {
        ...video.metadata,
        runwayResponse: status
      }
    });
  }

  private static async handleProcessingJob(video: any, status: any): Promise<void> {
    const progress = status.progress || 0;
    console.log(`⏳ Job en cours: ${video.runwayJobId} - ${progress}%`);
    
    await Video.findByIdAndUpdate(video._id, {
      progress: progress,
      lastPolledAt: new Date(),
      metadata: {
        ...video.metadata,
        lastStatus: status
      }
    });
  }

  private static async handleTimeoutJob(video: any): Promise<void> {
    console.log(`⏰ Job timeout: ${video.runwayJobId}`);
    
    await Video.findByIdAndUpdate(video._id, {
      status: 'failed',
      error: 'Timeout - Génération trop longue',
      generationEndedAt: new Date()
    });
  }

  static getStatus(): any {
    return {
      running: this.isRunning,
      stats: this.stats,
      nextRun: this.cronJob ? 'Toutes les 10 secondes' : null
    };
  }

  static resetStats(): void {
    this.stats = {
      totalPolled: 0,
      successfulUpdates: 0,
      errors: 0,
      lastPoll: null,
      activeJobs: 0
    };
    console.log('📊 Stats polling reset');
  }
}

export const runwayPollingService = RunwayPollingService;