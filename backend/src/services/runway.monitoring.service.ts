// backend/src/services/runway.monitoring.service.ts (version corrigée)
import { Video } from '../models/Video.model';
import { CreditTransaction } from '../models/CreditTransaction.model';
import { CreditsService } from './credits.service';

// ✅ Interface pour les résultats avec types corrects
interface OptimizationResults {
  actions: string[];
  metrics: {
    stylePerformance?: any[];
  };
  recommendations: string[];
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical' | 'error';
  timestamp: Date;
  metrics: {
    stuckJobs: number;
    queuedTooLong: number;
    failureRate: number;
    totalRecent: number;
  };
  alerts: string[]; // ✅ Type correct pour les alertes
}

export class RunwayMonitoringService {
  
  static async cleanupAbandonedJobs(): Promise<void> {
    try {
      console.log('🧹 Nettoyage des jobs Runway abandonnés...');
      
      const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
      
      const abandonedVideos = await Video.find({
        status: 'processing',
        runwayJobId: { $exists: true },
        generationStartedAt: { $lt: cutoffTime }
      });

      if (abandonedVideos.length === 0) {
        console.log('✅ Aucun job abandonné trouvé');
        return;
      }

      console.log(`🔄 ${abandonedVideos.length} job(s) abandonné(s) trouvé(s)`);

      for (const video of abandonedVideos) {
        try {
          await Video.findByIdAndUpdate(video._id, {
            status: 'failed',
            error: 'Job abandonné - timeout dépassé',
            generationEndedAt: new Date()
          });

          // ✅ Correction: accès sécurisé aux propriétés
          if (video.metadata?.creditCost) {
            await CreditsService.addCredits({
              userId: video.userId.toString(),
              amount: video.metadata.creditCost,
              source: 'refund',
              metadata: {
                reason: 'Job abandonné',
                originalVideoId: video._id.toString(),
                runwayJobId: video.runwayJobId
              }
            });

            console.log(`💰 ${video.metadata.creditCost} crédits remboursés pour ${video._id}`);
          }

          console.log(`🧹 Job nettoyé: ${video.runwayJobId}`);

        } catch (error: any) {
          console.error(`❌ Erreur nettoyage job ${video._id}:`, error.message);
        }
      }

      console.log(`✅ Nettoyage terminé: ${abandonedVideos.length} job(s) traité(s)`);

    } catch (error: any) {
      console.error('❌ Erreur nettoyage général:', error.message);
    }
  }

  static async generateActivityReport(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    try {
      console.log(`📊 Génération rapport Runway (${timeRange})`);

      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const videoStats = await Video.aggregate([
        {
          $match: {
            runwayJobId: { $exists: true },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalCredits: {
              $sum: {
                $ifNull: ['$metadata.creditCost', 0]
              }
            },
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

      const styleStats = await Video.aggregate([
        {
          $match: {
            runwayJobId: { $exists: true },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$style',
            count: { $sum: 1 },
            successRate: {
              $avg: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const creditStats = await CreditTransaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            type: 'debit',
            reason: { $regex: /runway/i }
          }
        },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            avgCreditsPerTransaction: { $avg: '$amount' }
          }
        }
      ]);

      const topUsers = await Video.aggregate([
        {
          $match: {
            runwayJobId: { $exists: true },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            videoCount: { $sum: 1 },
            successfulVideos: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { videoCount: -1 } },
        { $limit: 10 }
      ]);

      const report = {
        period: {
          timeRange,
          startDate,
          endDate: now
        },
        summary: {
          totalGenerations: videoStats.reduce((sum, stat) => sum + stat.count, 0),
          totalCreditsUsed: creditStats[0]?.totalCredits || 0,
          avgGenerationTime: videoStats.find(s => s.avgDuration)?.avgDuration || 0,
          successRate: this.calculateSuccessRate(videoStats)
        },
        breakdown: {
          byStatus: videoStats,
          byStyle: styleStats,
          credits: creditStats[0] || {},
          topUsers: topUsers.slice(0, 5)
        },
        alerts: await this.generateAlerts(videoStats, timeRange)
      };

      console.log('📊 Rapport généré:', report.summary);
      return report;

    } catch (error: any) {
      console.error('❌ Erreur génération rapport:', error.message);
      throw error;
    }
  }

  static async checkServiceHealth(): Promise<HealthCheckResult> {
    try {
      const now = new Date();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      const stuckJobs = await Video.countDocuments({
        status: 'processing',
        runwayJobId: { $exists: true },
        generationStartedAt: { $lt: new Date(now.getTime() - 5 * 60 * 1000) }
      });

      const recentStats = await Video.aggregate([
        {
          $match: {
            runwayJobId: { $exists: true },
            createdAt: { $gte: lastHour }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = recentStats.reduce((sum, stat) => sum + stat.count, 0);
      const failed = recentStats.find(s => s._id === 'failed')?.count || 0;
      const failureRate = total > 0 ? (failed / total) * 100 : 0;

      const queuedTooLong = await Video.countDocuments({
        status: 'pending',
        runwayJobId: { $exists: true },
        createdAt: { $lt: new Date(now.getTime() - 2 * 60 * 1000) }
      });

      const health: HealthCheckResult = {
        status: 'healthy',
        timestamp: now,
        metrics: {
          stuckJobs,
          queuedTooLong,
          failureRate: Math.round(failureRate * 100) / 100,
          totalRecent: total
        },
        alerts: [] // ✅ Initialisation correcte
      };

      if (stuckJobs > 3) {
        health.status = 'warning';
        health.alerts.push(`${stuckJobs} jobs bloqués depuis plus de 5 minutes`);
      }

      if (failureRate > 20) {
        health.status = 'warning';
        health.alerts.push(`Taux d'échec élevé: ${failureRate}%`);
      }

      if (queuedTooLong > 5) {
        health.status = 'critical';
        health.alerts.push(`${queuedTooLong} jobs en attente depuis plus de 2 minutes`);
      }

      if (failureRate > 50) {
        health.status = 'critical';
        health.alerts.push(`Taux d'échec critique: ${failureRate}%`);
      }

      return health;

    } catch (error: any) {
      return {
        status: 'error',
        timestamp: new Date(),
        metrics: {
          stuckJobs: 0,
          queuedTooLong: 0,
          failureRate: 0,
          totalRecent: 0
        },
        alerts: ['Impossible de vérifier la santé du service']
      };
    }
  }

  static async optimizePerformance(): Promise<OptimizationResults> {
    try {
      console.log('⚡ Optimisation des performances Runway...');

      const results: OptimizationResults = {
        actions: [],
        metrics: {},
        recommendations: []
      };

      await this.cleanupAbandonedJobs();
      results.actions.push('Jobs abandonnés nettoyés');

      const stylePerformance = await Video.aggregate([
        {
          $match: {
            runwayJobId: { $exists: true },
            status: { $in: ['completed', 'failed'] },
            generationStartedAt: { $exists: true },
            generationEndedAt: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$style',
            totalJobs: { $sum: 1 },
            successfulJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            avgDuration: {
              $avg: {
                $divide: [
                  { $subtract: ['$generationEndedAt', '$generationStartedAt'] },
                  1000
                ]
              }
            }
          }
        },
        {
          $addFields: {
            successRate: { $divide: ['$successfulJobs', '$totalJobs'] }
          }
        },
        { $sort: { successRate: -1, avgDuration: 1 } }
      ]);

      results.metrics.stylePerformance = stylePerformance;
      results.actions.push('Analyse performance par style effectuée');

      const recommendations: string[] = [];

      if (stylePerformance.length > 0) {
        const bestStyle = stylePerformance[0];
        const worstStyle = stylePerformance[stylePerformance.length - 1];

        if (bestStyle.successRate > 0.9) {
          recommendations.push(`Style "${bestStyle._id}" très performant (${Math.round(bestStyle.successRate * 100)}% succès)`);
        }

        if (worstStyle.successRate < 0.5) {
          recommendations.push(`Style "${worstStyle._id}" problématique (${Math.round(worstStyle.successRate * 100)}% succès)`);
        }
      }

      results.recommendations = recommendations;
      results.actions.push('Recommandations générées');

      console.log('⚡ Optimisation terminée:', results.actions.length, 'actions');
      return results;

    } catch (error: any) {
      console.error('❌ Erreur optimisation:', error.message);
      throw error;
    }
  }

  static async exportAnalyticsData(days: number = 7): Promise<any> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const data = await Video.find({
        runwayJobId: { $exists: true },
        createdAt: { $gte: startDate }
      })
      .select({
        _id: 1,
        userId: 1,
        status: 1,
        style: 1,
        createdAt: 1,
        generationStartedAt: 1,
        generationEndedAt: 1,
        progress: 1,
        'metadata.creditCost': 1,
        error: 1
      })
      .lean();

      const enrichedData = data.map(video => ({
        ...video,
        duration: video.generationStartedAt && video.generationEndedAt 
          ? (new Date(video.generationEndedAt).getTime() - new Date(video.generationStartedAt).getTime()) / 1000
          : null,
        isSuccess: video.status === 'completed',
        dayOfWeek: new Date(video.createdAt).getDay(),
        hourOfDay: new Date(video.createdAt).getHours()
      }));

      return {
        period: { days, startDate, endDate: new Date() },
        totalRecords: enrichedData.length,
        data: enrichedData,
        summary: {
          successRate: enrichedData.filter(v => v.isSuccess).length / enrichedData.length,
          avgDuration: enrichedData
            .filter(v => v.duration)
            .reduce((sum, v) => sum + v.duration!, 0) / enrichedData.filter(v => v.duration).length,
          totalCreditsUsed: enrichedData.reduce((sum, v) => sum + (v.metadata?.creditCost || 0), 0)
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur export données:', error.message);
      throw error;
    }
  }

  private static calculateSuccessRate(stats: any[]): number {
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const successful = stats.find(s => s._id === 'completed')?.count || 0;
    
    return total > 0 ? Math.round((successful / total) * 10000) / 100 : 0;
  }

  private static async generateAlerts(stats: any[], timeRange: string): Promise<string[]> {
    const alerts: string[] = [];
    
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const failed = stats.find(s => s._id === 'failed')?.count || 0;
    const processing = stats.find(s => s._id === 'processing')?.count || 0;

    if (total === 0) {
      alerts.push(`Aucune génération dans la dernière ${timeRange}`);
    }

    if (total > 0) {
      const failureRate = (failed / total) * 100;
      
      if (failureRate > 30) {
        alerts.push(`Taux d'échec élevé: ${Math.round(failureRate)}%`);
      }

      if (processing > total * 0.3) {
        alerts.push(`Beaucoup de jobs en cours: ${processing}/${total}`);
      }
    }

    const stuckJobs = await Video.countDocuments({
      status: 'processing',
      runwayJobId: { $exists: true },
      generationStartedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (stuckJobs > 0) {
      alerts.push(`${stuckJobs} job(s) potentiellement bloqué(s)`);
    }

    return alerts;
  }
}

export const runwayMonitoringService = RunwayMonitoringService;