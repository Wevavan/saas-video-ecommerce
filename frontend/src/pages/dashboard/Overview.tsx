// frontend/src/pages/dashboard/Overview.tsx

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../hooks/useStats';
import { useCredits } from '../../hooks/useCredits';
import { useCreditUsage } from '../../hooks/useCreditUsage ';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { UsageChart } from '../../components/dashboard/UsageChart';
import { CreditCounter } from '../../components/credits/CreditCounter';
import { CreditUsageChart } from '../../components/credits/CreditUsageChart';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Video, 
  CreditCard, 
  Clock, 
  TrendingUp,
  Plus,
  RefreshCw,
  Zap,
  AlertTriangle,
  Target
} from 'lucide-react';

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error, refreshStats } = useStats();
  const { balance, consumeCredits, isLowCredits, hasEnoughCredits } = useCredits();
  const { stats: usageStats, hasActivity } = useCreditUsage(7);

  const handleRefresh = () => {
    refreshStats();
  };

  const handleTestConsume = async (amount: number) => {
    if (!hasEnoughCredits(amount)) {
      alert(`Solde insuffisant ! Vous avez ${balance} crédits, il en faut ${amount}.`);
      return;
    }

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
          <Button size="sm" disabled={!hasEnoughCredits(1)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle vidéo
          </Button>
        </div>
      </div>

      {/* Alerte crédits bas */}
      {isLowCredits() && (
        <Card className="border-2 border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800">Crédits faibles</h3>
                <p className="text-orange-700 text-sm mt-1">
                  Il vous reste seulement {balance} crédits. Pensez à recharger votre compte.
                </p>
                <Button size="sm" className="mt-2" variant="outline">
                  <Zap className="w-3 h-3 mr-1" />
                  Recharger maintenant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          value={usageStats?.totalConsumed || stats?.stats.creditsUsed || 0}
          description={`Reste ${balance} crédits`}
          icon={CreditCard}
          trend={usageStats?.trend === 'increasing' ? 'down' : usageStats?.trend === 'decreasing' ? 'up' : 'neutral'}
          trendValue={usageStats?.avgDailyConsumption ? `${usageStats.avgDailyConsumption.toFixed(1)}/jour` : undefined}
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

      {/* Charts + Informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart - Prend plus de place */}
        <div className="lg:col-span-2">
          {hasActivity() ? (
            <CreditUsageChart 
              period={7}
              showStats={true}
              showPredictions={false}
              currentBalance={balance}
            />
          ) : (
            <UsageChart 
              data={stats?.usageData || []} 
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Informations plan + Crédits */}
        <div className="space-y-4">
          {/* Credit Counter compact */}
          <CreditCounter 
            compact={false}
            showDetails={true}
            showActions={false}
          />

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
                  <Badge variant="outline" className="capitalize">
                    {user?.plan || 'Free'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Crédits restants</span>
                  <span className={`font-medium ${isLowCredits() ? 'text-orange-600' : ''}`}>
                    {balance}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vidéos créées</span>
                  <span className="font-medium">{stats?.stats.videosGenerated || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Temps économisé</span>
                  <span className="font-medium">{stats?.stats.timesSaved || 0}h</span>
                </div>

                {/* Utilisation moyenne */}
                {usageStats?.avgDailyConsumption && usageStats.avgDailyConsumption > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Usage moyen</span>
                    <span className="font-medium">{usageStats.avgDailyConsumption.toFixed(1)}/jour</span>
                  </div>
                )}
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
                  <Target className="w-4 h-4 mr-2" />
                  Upgrade vers Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
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
                disabled={!hasEnoughCredits(1)}
              >
                Consommer 1 crédit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConsume(2)}
                disabled={!hasEnoughCredits(2)}
              >
                Consommer 2 crédits
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConsume(5)}
                disabled={!hasEnoughCredits(5)}
              >
                Consommer 5 crédits
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Ces boutons disparaîtront en production</p>
              <p>Solde actuel: {balance} crédits</p>
              {usageStats && (
                <p>Usage moyen: {usageStats.avgDailyConsumption.toFixed(1)} crédits/jour</p>
              )}
            </div>
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
                Vous avez {balance} crédits gratuits pour commencer.
              </p>
              <Button disabled={!hasEnoughCredits(1)}>
                <Plus className="w-4 h-4 mr-2" />
                {hasEnoughCredits(1) ? 'Générer ma première vidéo' : 'Solde insuffisant'}
              </Button>
              {!hasEnoughCredits(1) && (
                <p className="text-xs text-muted-foreground mt-2">
                  Il faut au moins 1 crédit pour créer une vidéo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section statistiques avancées pour utilisateurs actifs */}
      {!isLoading && stats?.stats.videosGenerated && stats.stats.videosGenerated > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques d'activité</CardTitle>
            <CardDescription>
              Résumé de votre utilisation récente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.stats.videosGenerated}</p>
                <p className="text-sm text-muted-foreground">Vidéos créées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{usageStats?.totalConsumed || 0}</p>
                <p className="text-sm text-muted-foreground">Crédits consommés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.stats.timesSaved || 0}h</p>
                <p className="text-sm text-muted-foreground">Temps économisé</p>
              </div>
            </div>
            
            {usageStats?.trend && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tendance d'usage:</span>
                  <Badge variant={
                    usageStats.trend === 'increasing' ? 'destructive' : 
                    usageStats.trend === 'decreasing' ? 'default' : 
                    'secondary'
                  }>
                    {usageStats.trend === 'increasing' ? 'En hausse' : 
                     usageStats.trend === 'decreasing' ? 'En baisse' : 
                     'Stable'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};