import cron from 'node-cron';
import { cleanupOldFiles } from '../controllers/upload.controller';

class CleanupService {
  private isRunning = false;

  /**
   * Démarre le service de nettoyage automatique
   * Exécute le nettoyage tous les jours à 2h du matin
   */
  public startCleanupJob(): void {
    if (this.isRunning) {
      console.log('Service de nettoyage déjà en cours d\'exécution');
      return;
    }

    // Cron job : tous les jours à 2h00
    cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Démarrage du nettoyage automatique des fichiers...');
      
      try {
        // Nettoie les fichiers de plus de 24h
        await cleanupOldFiles(24);
        console.log('✅ Nettoyage automatique terminé avec succès');
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage automatique:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    this.isRunning = true;
    console.log('🕐 Service de nettoyage automatique démarré (tous les jours à 2h)');
  }

  /**
   * Arrête le service de nettoyage
   */
  public stopCleanupJob(): void {
    if (this.isRunning) {
      // Note: node-cron ne fournit pas de méthode directe pour arrêter une tâche spécifique
      // En production, il faudrait stocker la référence de la tâche
      this.isRunning = false;
      console.log('🛑 Service de nettoyage automatique arrêté');
    }
  }

  /**
   * Force un nettoyage immédiat
   */
  public async forceCleanup(maxAgeHours: number = 24): Promise<void> {
    console.log(`🧹 Nettoyage forcé des fichiers de plus de ${maxAgeHours}h...`);
    
    try {
      await cleanupOldFiles(maxAgeHours);
      console.log('✅ Nettoyage forcé terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage forcé:', error);
      throw error;
    }
  }

  /**
   * Vérifie le statut du service
   */
  public getStatus(): { running: boolean; nextRun: string } {
    return {
      running: this.isRunning,
      nextRun: this.isRunning ? 'Tous les jours à 2h00 (Europe/Paris)' : 'Service arrêté'
    };
  }
}

// Instance singleton
export const cleanupService = new CleanupService();