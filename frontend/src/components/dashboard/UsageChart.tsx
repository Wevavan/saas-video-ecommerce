import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { VideoUsageData } from '../../hooks/useStats';

interface UsageChartProps {
  data: VideoUsageData[];
  isLoading?: boolean;
}

export const UsageChart: React.FC<UsageChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-72 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{formattedDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'videos' 
                ? `Vidéos générées: ${entry.value}` 
                : `Crédits consommés: ${entry.value}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculer les totaux pour l'affichage
  const totalVideos = data.reduce((sum, day) => sum + day.videos, 0);
  const totalCredits = data.reduce((sum, day) => sum + day.credits, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre activité des 7 derniers jours</CardTitle>
        <CardDescription>
          Basé sur votre historique réel de consommation de crédits
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 || totalCredits === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Aucune activité récente</p>
              <p className="text-sm text-muted-foreground">
                Vos statistiques d'usage apparaîtront ici une fois que vous aurez généré des vidéos.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Résumé */}
            <div className="flex justify-between items-center mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalVideos}</p>
                <p className="text-xs text-muted-foreground">Vidéos générées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{totalCredits}</p>
                <p className="text-xs text-muted-foreground">Crédits consommés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{(totalVideos * 0.5).toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Temps économisé</p>
              </div>
            </div>

            {/* Graphique */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="videos"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Vidéos"
                  />
                  <Line
                    type="monotone"
                    dataKey="credits"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 3 }}
                    name="Crédits"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};