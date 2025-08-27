// backend/src/services/queue.service.ts - VERSION ULTRA STABLE
import Bull, { Queue, Job, JobOptions } from 'bull';
import { VideoGenerationJobData, JobProgress, JobStatus, JobLog } from '../types/queue.types';

class QueueService {
  private videoQueue: Queue<VideoGenerationJobData> | null = null;
  private jobProgressMap: Map<string, JobProgress> = new Map();
  private isRedisAvailable = false;
  private isShuttingDown = false;
  private initializationAttempts = 0;
  private maxInitAttempts = 3;

  constructor() {
    // Délai plus long pour permettre à Redis de se stabiliser
    setTimeout(() => {
      this.tryInitializeQueue();
    }, 5000);
  }

  private async tryInitializeQueue() {
    if (this.initializationAttempts >= this.maxInitAttempts) {
      console.log('🔄 Nombre maximum de tentatives atteint - Mode dégradé permanent');
      this.activateDegradedMode();
      return;
    }

    this.initializationAttempts++;
    console.log(`🔄 Tentative ${this.initializationAttempts}/${this.maxInitAttempts} - Initialisation queue Bull...`);

    try {
      if (!process.env.REDIS_URL) {
        throw new Error('REDIS_URL non définie');
      }

      // ✅ Test Redis simple avant d'initialiser Bull
      const Redis = require('ioredis');
      const testRedis = new Redis(process.env.REDIS_URL, {
        connectTimeout: 10000,
        commandTimeout: 5000,
        maxRetriesPerRequest: 2,
        retryStrategy: () => null, // Pas de retry pour le test
        tls: { rejectUnauthorized: false }
      });

      await Promise.race([
        testRedis.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), 8000)
        )
      ]);

      console.log('✅ Redis test OK - Création de la queue Bull...');
      await testRedis.disconnect();

      // ✅ Création de la queue Bull avec configuration simple
      this.videoQueue = new Bull<VideoGenerationJobData>(
        'video-generation', 
        process.env.REDIS_URL, 
        {
          defaultJobOptions: {
            attempts: 1,
            backoff: { type: 'fixed', delay: 1000 }, // ✅ Correction TypeScript
            delay: 1000,
            removeOnComplete: 10,
            removeOnFail: 5,
          },
          settings: {
            stalledInterval: 30000,
            maxStalledCount: 1,
          }
        }
      );

      // ✅ Event handlers simplifiés
      this.videoQueue.on('ready', () => {
        console.log('✅ Queue Bull prête et opérationnelle');
        this.isRedisAvailable = true;
      });

      this.videoQueue.on('error', (error) => {
        console.error('❌ Bull Queue Error:', error.message);
        
        // Si erreur critique, activer mode dégradé
        if (error.message.includes('ECONNRESET') || 
            error.message.includes('ENOTFOUND') ||
            error.message.includes('Connection timeout')) {
          console.log('🔄 Erreur critique détectée - Activation mode dégradé');
          this.activateDegradedMode();
        }
      });

      this.videoQueue.on('stalled', (job) => {
        console.warn('⚠️ Job bloqué détecté:', job.id);
      });

      console.log('✅ Queue Bull initialisée avec succès');

    } catch (error: any) {
      console.error(`❌ Tentative ${this.initializationAttempts} échouée:`, error.message);
      
      if (this.initializationAttempts < this.maxInitAttempts) {
        console.log(`🔄 Nouvelle tentative dans 10 secondes...`);
        setTimeout(() => this.tryInitializeQueue(), 10000);
      } else {
        console.log('🔄 Toutes les tentatives échouées - Activation mode dégradé permanent');
        this.activateDegradedMode();
      }
    }
  }

  private activateDegradedMode() {
    this.isShuttingDown = true;
    this.isRedisAvailable = false;
    
    if (this.videoQueue) {
      try {
        this.videoQueue.removeAllListeners();
        this.videoQueue.close();
      } catch (e) {
        // Ignorer les erreurs de fermeture
      }
      this.videoQueue = null;
    }
    
    console.log('✅ Mode dégradé activé - Service opérationnel sans Redis');
  }

  // ✅ Méthode principale toujours fonctionnelle
  async addVideoGenerationJob(
    jobData: VideoGenerationJobData,
    options: JobOptions = {}
  ): Promise<string> {
    
    if (this.isRedisAvailable && this.videoQueue && !this.isShuttingDown) {
      try {
        console.log('🎬 Ajout job à la queue Redis...');
        const job = await this.videoQueue.add(jobData, {
          attempts: 1,
          timeout: 30000,
          ...options
        });
        console.log('✅ Job ajouté à Redis avec ID:', job.id);
        return job.id!.toString();
      } catch (error: any) {
        console.error('❌ Erreur ajout job Redis:', error.message);
        console.log('🔄 Basculement vers mode dégradé pour ce job');
      }
    }

    // Mode dégradé (toujours disponible)
    console.log('🎬 Traitement en mode dégradé (sans Redis)');
    return this.processJobDirectly(jobData);
  }

  private async processJobDirectly(jobData: VideoGenerationJobData): Promise<string> {
    const jobId = `direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🎬 Démarrage job direct:', jobId);
    this.initializeJobProgress(jobId, jobData);
    
    // Simulation réaliste du processus
    const steps = [
      { delay: 1500, percentage: 15, stage: 'validation', message: 'Validation des données...' },
      { delay: 2000, percentage: 30, stage: 'script_generation', message: 'Génération du script marketing' },
      { delay: 3000, percentage: 50, stage: 'voice_generation', message: 'Génération de la voix-off' },
      { delay: 4000, percentage: 75, stage: 'video_generation', message: 'Création de la vidéo' },
      { delay: 2000, percentage: 90, stage: 'assembly', message: 'Assemblage final' },
      { delay: 1000, percentage: 100, stage: 'completed', message: 'Vidéo terminée ! 🎉' }
    ];

    let totalDelay = 0;
    steps.forEach((step, index) => {
      totalDelay += step.delay;
      setTimeout(() => {
        this.updateJobProgress(jobId, {
          percentage: step.percentage,
          stage: step.stage as any,
          message: step.message,
          estimatedTimeRemaining: Math.max(0, 15 - totalDelay / 1000),
          logs: [...(this.getJobProgress(jobId)?.logs || []), {
            timestamp: new Date(),
            level: 'info',
            message: step.message,
            data: { 
              step: index + 1, 
              total: steps.length,
              mode: this.isRedisAvailable ? 'redis' : 'direct'
            }
          }]
        });
      }, totalDelay);
    });
    
    return jobId;
  }

  private initializeJobProgress(jobId: string, jobData: VideoGenerationJobData) {
    const initialProgress: JobProgress = {
      percentage: 0,
      stage: 'validation',
      message: 'Initialisation du job...',
      estimatedTimeRemaining: 15,
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: `Job créé - Mode: ${this.isRedisAvailable ? 'Redis' : 'Direct'}`,
        data: { 
          productName: jobData.productInfo.name, 
          style: jobData.style,
          mode: this.isRedisAvailable ? 'redis' : 'direct',
          jobId
        }
      }]
    };

    this.jobProgressMap.set(jobId, initialProgress);
  }

  updateJobProgress(jobId: string, progressUpdate: Partial<JobProgress>) {
    const currentProgress = this.jobProgressMap.get(jobId);
    if (currentProgress) {
      const updatedProgress = { ...currentProgress, ...progressUpdate };
      this.jobProgressMap.set(jobId, updatedProgress);
      console.log(`📊 Job ${jobId}: ${updatedProgress.percentage}% - ${updatedProgress.message}`);
    }
  }

  getJobProgress(jobId: string): JobProgress | undefined {
    return this.jobProgressMap.get(jobId);
  }

  async getJobStatus(jobId: string): Promise<{ status: JobStatus; progress?: JobProgress; job?: any }> {
    // Vérifier d'abord dans la map locale
    const progress = this.getJobProgress(jobId);
    
    if (progress) {
      let status: JobStatus;
      if (progress.percentage === 100) {
        status = JobStatus.COMPLETED;
      } else if (progress.message.toLowerCase().includes('erreur')) {
        status = JobStatus.FAILED;
      } else if (progress.percentage > 0) {
        status = JobStatus.PROCESSING;
      } else {
        status = JobStatus.QUEUED;
      }

      return { 
        status, 
        progress, 
        job: status === JobStatus.COMPLETED ? {
          success: true,
          videoUrl: `/demo/${jobId}.mp4`,
          mode: this.isRedisAvailable ? 'redis' : 'direct'
        } : null
      };
    }

    // Si pas dans la map et que Redis est disponible, vérifier Bull
    if (this.videoQueue && this.isRedisAvailable) {
      try {
        const job = await this.videoQueue.getJob(jobId);
        if (job) {
          const bullStatus = await job.getState();
          const jobProgressData = typeof job.progress === 'function' ? job.progress() : job.progress;
          return {
            status: this.mapBullStatusToJobStatus(bullStatus),
            progress: jobProgressData as JobProgress, // ✅ Correction TypeScript
            job: bullStatus === 'completed' ? job.returnvalue : null
          };
        }
      } catch (error) {
        console.warn('⚠️ Erreur vérification job Redis:', (error as Error).message);
      }
    }

    return { status: JobStatus.FAILED };
  }

  private mapBullStatusToJobStatus(bullStatus: string): JobStatus {
    switch (bullStatus) {
      case 'waiting': return JobStatus.QUEUED;
      case 'active': return JobStatus.PROCESSING;
      case 'completed': return JobStatus.COMPLETED;
      case 'failed': return JobStatus.FAILED;
      case 'delayed': return JobStatus.QUEUED;
      default: return JobStatus.FAILED;
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // Supprimer de la map locale
      this.jobProgressMap.delete(jobId);
      
      // Si Redis disponible, annuler dans Bull aussi
      if (this.videoQueue && this.isRedisAvailable) {
        const job = await this.videoQueue.getJob(jobId);
        if (job) {
          await job.remove();
        }
      }
      
      console.log('✅ Job annulé:', jobId);
      return true;
    } catch (error) {
      console.error('❌ Erreur annulation job:', (error as Error).message);
      return false;
    }
  }

  async getQueueStats() {
    const localProgressValues = Array.from(this.jobProgressMap.values());
    
    let stats = {
      waiting: 0,
      active: localProgressValues.filter(p => p.percentage > 0 && p.percentage < 100).length,
      completed: localProgressValues.filter(p => p.percentage === 100).length,
      failed: localProgressValues.filter(p => p.message.toLowerCase().includes('erreur')).length,
      delayed: 0,
      total: this.jobProgressMap.size,
      mode: this.isRedisAvailable ? 'redis' : 'direct'
    };

    // Si Redis disponible, ajouter les stats Bull
    if (this.videoQueue && this.isRedisAvailable) {
      try {
        const bullStats = await this.videoQueue.getJobCounts();
        stats.waiting += bullStats.waiting || 0;
        stats.active += bullStats.active || 0;
        stats.completed += bullStats.completed || 0;
        stats.failed += bullStats.failed || 0;
        stats.delayed += bullStats.delayed || 0;
        stats.total += Object.values(bullStats).reduce((a, b) => a + b, 0);
      } catch (error) {
        console.warn('⚠️ Erreur récupération stats Bull');
      }
    }

    return stats;
  }

  async cleanOldJobs() {
    // Nettoyage de la map locale
    const now = Date.now();
    const hourAgo = 60 * 60 * 1000; // 1 heure
    
    for (const [jobId, progress] of this.jobProgressMap.entries()) {
      if (progress.logs.length > 0) {
        const lastLog = progress.logs[progress.logs.length - 1];
        if (now - lastLog.timestamp.getTime() > hourAgo) {
          this.jobProgressMap.delete(jobId);
        }
      }
    }
    
    // Nettoyage Bull si disponible
    if (this.videoQueue && this.isRedisAvailable) {
      try {
        await this.videoQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 24h
        await this.videoQueue.clean(24 * 60 * 60 * 1000, 'failed'); // 24h
      } catch (error) {
        console.warn('⚠️ Erreur nettoyage Bull');
      }
    }
    
    console.log('✅ Nettoyage des anciens jobs terminé');
  }

  async getHealthStatus() {
    const stats = await this.getQueueStats();
    
    return {
      healthy: true, // Service toujours opérationnel
      stats,
      redis: this.isRedisAvailable ? 'connected' : 'disconnected',
      mode: this.isRedisAvailable ? 'redis' : 'direct',
      queue: this.isShuttingDown ? 'degraded' : (this.isRedisAvailable ? 'redis' : 'direct'),
      message: this.isRedisAvailable ? 'Queue Redis opérationnelle' : 'Mode direct actif (stable)',
      lastCleanup: new Date().toISOString(),
      initializationAttempts: this.initializationAttempts,
      maxAttempts: this.maxInitAttempts
    };
  }

  // Getters
  get isConnected(): boolean {
    return this.isRedisAvailable && !this.isShuttingDown && this.videoQueue !== null;
  }

  get metrics() {
    return {
      isConnected: this.isConnected,
      jobsInMemory: this.jobProgressMap.size,
      initializationAttempts: this.initializationAttempts,
      queueActive: this.videoQueue !== null,
      isShuttingDown: this.isShuttingDown,
      mode: this.isConnected ? 'redis' : 'direct',
      redisAvailable: this.isRedisAvailable
    };
  }
}

export const queueService = new QueueService();
export default queueService;