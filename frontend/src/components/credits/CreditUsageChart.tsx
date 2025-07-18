import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface CreditUsageChartProps {
  data?: Array<{
    date: string;
    consumed: number;
    added: number;
  }>;
}

export const CreditUsageChart: React.FC<CreditUsageChartProps> = ({ data = [] }) => {
  // Données mockées si pas de données
  const chartData = data.length > 0 ? data : [
    { date: '2024-07-12', consumed: 4, added: 0 },
    { date: '2024-07-13', consumed: 6, added: 100 },
    { date: '2024-07-14', consumed: 2, added: 0 },
    { date: '2024-07-15', consumed: 8, added: 0 },
    { date: '2024-07-16', consumed: 3, added: 0 },
    { date: '2024-07-17', consumed: 5, added: 0 },
    { date: '2024-07-18', consumed: 1, added: 0 },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingDown className="w-5 h-5" />
          <span>Consommation des 7 derniers jours</span>
        </CardTitle>
        <CardDescription>
          Suivez votre usage quotidien de crédits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'consumed' ? 'Consommés' : 'Ajoutés'
                ]}
              />
              <Line
                type="monotone"
                dataKey="consumed"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2 }}
                name="consumed"
              />
              <Line
                type="monotone"
                dataKey="added"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                name="added"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};