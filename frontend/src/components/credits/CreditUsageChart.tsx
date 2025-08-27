// frontend/src/components/credits/CreditUsageChart.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, RefreshCw, AlertCircle, Target, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useCreditUsage } from '../../hooks/useCreditUsage ';
import type { UsageDataPoint } from '../../hooks/useCreditUsage ';

interface CreditUsageChartProps {
  data?: UsageDataPoint[];
  showRefresh?: boolean;
  showStats?: boolean;
  showPredictions?: boolean;
  period?: 7 | 14 | 30; // Nombre de jours à afficher
  currentBalance?: number;
}

export const CreditUsageChart: React.FC<CreditUsageChartProps> = ({ 
  data: externalData,
  showRefresh = true,
  showStats = true,
  showPredictions = false,
  period = 7,
  currentBalance = 0
}) => {
  const { 
    data: hookData, 
    stats, 
    isLoading, 
    error, 
    refreshData,
    predictNextWeekConsumption,
    getDaysUntilEmpty,
    hasActivity
  } = useCreditUsage(period);

  // Utilise les données externes si fournies, sinon celles du hook
  const chartData = externalData || hookData;

  // Calculer les statistiques si pas fournies par le hook
  const totalConsumed = stats?.totalConsumed || chartData.reduce((sum: number, point: UsageDataPoint) => sum + point.consumed, 0);
  const totalAdded = stats?.totalAdded || chartData.reduce((sum: number, point: UsageDataPoint) => sum + point.added, 0);
  const avgDailyConsumption = stats?.avgDailyConsumption || (chartData.length > 0 ? totalConsumed / chartData.length : 0);

  // Prédictions
  const nextWeekPrediction = predictNextWeekConsumption ? predictNextWeekConsumption() : Math.round(avgDailyConsumption * 7);
  const daysUntilEmpty = getDaysUntilEmpty ? getDaysUntilEmpty(currentBalance) : (avgDailyConsumption > 0 ? Math.floor(currentBalance / avgDailyConsumption) : Infinity);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric'
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5" />
              <span>Consommation des {period} derniers jours</span>
            </CardTitle>
            <CardDescription>
              Suivez votre usage quotidien de crédits
            </CardDescription>
          </div>
          
          {showRefresh && !externalData && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          // État d'erreur
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Erreur de chargement
              </p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshData}>
              Réessayer
            </Button>
          </div>
        ) : isLoading ? (
          // État de chargement
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Chargement des données...</p>
            </div>
          </div>
        ) : chartData.length === 0 || !hasActivity ? (
          // État vide
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <TrendingDown className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Aucune activité de crédits
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Vos transactions apparaîtront ici après utilisation
              </p>
            </div>
          </div>
        ) : (
          // Graphique avec données
          <div className="space-y-4">
            {/* Statistiques rapides */}
            {showStats && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total consommé</p>
                  <p className="text-lg font-semibold text-red-600">{totalConsumed}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total ajouté</p>
                  <p className="text-lg font-semibold text-green-600">{totalAdded}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Moy./jour</p>
                  <p className="text-lg font-semibold">{avgDailyConsumption.toFixed(1)}</p>
                </div>
              </div>
            )}

            {/* Prédictions */}
            {showPredictions && avgDailyConsumption > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Prévision 7 jours</p>
                    <p className="text-xs text-blue-600">≈ {nextWeekPrediction} crédits</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Autonomie</p>
                    <p className="text-xs text-blue-600">
                      {daysUntilEmpty === Infinity ? 'Illimitée' : `≈ ${daysUntilEmpty} jours`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Badge de tendance */}
            {showStats && stats?.peakConsumptionDay && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Pic de consommation:</span>
                  <Badge variant="outline">
                    {formatDate(stats.peakConsumptionDay)}
                  </Badge>
                </div>
                {totalConsumed > totalAdded && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Consommation nette
                  </Badge>
                )}
              </div>
            )}

            {/* Graphique */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    className="text-xs"
                    interval="preserveStartEnd"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(value) => formatFullDate(value as string)}
                    formatter={(value: number, name: string) => {
                      const labels = {
                        consumed: 'Consommés',
                        added: 'Ajoutés',
                        balance: 'Solde'
                      };
                      return [value, labels[name as keyof typeof labels] || name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  
                  {/* Ligne des crédits consommés */}
                  <Line
                    type="monotone"
                    dataKey="consumed"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                    name="consumed"
                    connectNulls={false}
                  />
                  
                  {/* Ligne des crédits ajoutés */}
                  <Line
                    type="monotone"
                    dataKey="added"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    name="added"
                    connectNulls={false}
                  />
                  
                  {/* Ligne du solde (optionnelle) */}
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="balance"
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Légende personnalisée */}
            <div className="flex items-center justify-center space-x-6 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Crédits consommés</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Crédits ajoutés</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-muted-foreground" style={{borderTop: '1px dashed'}}></div>
                <span>Solde</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};