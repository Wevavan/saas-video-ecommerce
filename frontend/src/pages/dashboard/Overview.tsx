import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../hooks/useStats';
import { useCredits } from '../../hooks/useCredits';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { UsageChart } from '../../components/dashboard/UsageChart';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Video, 
  CreditCard, 
  Clock, 
  TrendingUp,
  Plus,
  RefreshCw
} from 'lucide-react';

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error, refreshStats } = useStats();
  const { consumeCredits } = useCredits();

  const handleRefresh = () => {
    refreshStats();
  };

  const handleTestConsume = async (amount: number) => {
    try {
      await consumeCredits({
        amount,
        reason: `Test consommation ${amount} crédit${amount > 1 ? 's' : ''} depuis Overview`,
        metadata: {
          description: 'Test depuis page Overview'
        }
      });
    } catch (error) {
      console.error('Erreur test consommation:', error);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            Bienvenue, {user?.name?.split(' ')[0]} ! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici vos statistiques réelles d'utilisation.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle vidéo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Vidéos générées"
          value={stats?.stats.videosGenerated || 0}
          description="Basé sur votre consommation"
          icon={Video}
          trend={stats?.stats.videosGenerated && stats.stats.videosGenerated > 0 ? "up" : "neutral"}
          trendValue={stats?.stats.videosGenerated ? `${stats.stats.videosGenerated} vidéo${stats.stats.videosGenerated > 1 ? 's' : ''}` : undefined}
          isLoading={isLoading}
          delay={0}
        />
        <StatsCard
          title="Crédits utilisés"
          value={stats?.stats.creditsUsed || 0}
          description={`Reste ${user?.credits || 0} crédits`}
          icon={CreditCard}
          trend="neutral"
          isLoading={isLoading}
          delay={100}
        />
        <StatsCard
          title="Temps économisé"
          value={`${stats?.stats.timesSaved || 0}h`}
          description="vs création manuelle"
          icon={Clock}
          trend={stats?.stats.timesSaved && stats.stats.timesSaved > 0 ? "up" : "neutral"}
          trendValue={stats?.stats.timesSaved ? `${stats.stats.timesSaved}h économisées` : undefined}
          isLoading={isLoading}
          delay={200}
        />
        <StatsCard
          title="Progression"
          value={`${Math.round((stats?.stats.planUsage.current || 0) / (stats?.stats.planUsage.limit || 1) * 100)}%`}
          description={`${stats?.stats.planUsage.current || 0}/${stats?.stats.planUsage.limit || 10} utilisées`}
          icon={TrendingUp}
          trend={stats?.stats.planUsage.current && stats.stats.planUsage.current > 0 ? "up" : "neutral"}
          isLoading={isLoading}
          delay={300}
        />
      </div>

      {/* Chart + Informations plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart - Prend plus de place */}
        <div className="lg:col-span-2">
          <UsageChart 
            data={stats?.usageData || []} 
            isLoading={isLoading}
          />
        </div>

        {/* Informations plan */}
        <Card>
          <CardHeader>
            <CardTitle>Votre plan actuel</CardTitle>
            <CardDescription>
              Informations de votre abonnement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-medium capitalize">{user?.plan}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Crédits restants</span>
                <span className="font-medium">{user?.credits}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vidéos créées</span>
                <span className="font-medium">{stats?.stats.videosGenerated || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Temps économisé</span>
                <span className="font-medium">{stats?.stats.timesSaved || 0}h</span>
              </div>
            </div>

            {/* Progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilisation</span>
                <span>{stats?.stats.planUsage.current || 0}/{stats?.stats.planUsage.limit || 10}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min((stats?.stats.planUsage.current || 0) / (stats?.stats.planUsage.limit || 1) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>

            {user?.plan === 'free' && (
              <Button className="w-full" variant="outline">
                Upgrade vers Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tests développement */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tests développement</CardTitle>
            <CardDescription>
              Testez la consommation de crédits (dev uniquement)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConsume(1)}
              >
                Consommer 1 crédit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConsume(2)}
              >
                Consommer 2 crédits
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ces boutons disparaîtront en production
            </p>
          </CardContent>
        </Card>
      )}

      {/* Message si aucune activité */}
      {!isLoading && stats?.stats.videosGenerated === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Créez votre première vidéo !</h3>
              <p className="text-muted-foreground mb-4">
                Vous avez {user?.credits} crédits gratuits pour commencer.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Générer ma première vidéo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section coming soon pour vidéos récentes */}
      {!isLoading && stats?.stats.videosGenerated && stats.stats.videosGenerated > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vidéos récentes</CardTitle>
            <CardDescription>
              Bientôt disponible - En cours d'implémentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                L'affichage de vos vidéos sera disponible après l'implémentation de l'API vidéos.
              </p>
              <p className="text-xs text-muted-foreground">
                Prévu pour le JOUR 3-4 du planning de développement
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};