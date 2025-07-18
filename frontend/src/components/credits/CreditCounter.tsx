// frontend/src/components/credits/CreditCounter.tsx

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CreditCard, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { useCredits } from '../../hooks/useCredits';

interface CreditCounterProps {
  showDetails?: boolean;
  showActions?: boolean;
  compact?: boolean;
  onBuyCredits?: () => void;
}

export const CreditCounter: React.FC<CreditCounterProps> = ({
  showDetails = true,
  showActions = true,
  compact = false,
  onBuyCredits
}) => {
  const { balance, isLowCredits, isRefreshing } = useCredits();

  const getProgressPercentage = () => {
    // Progression basée sur 100 crédits max pour les plans gratuits
    const maxCredits = 10;
    return Math.min((balance / maxCredits) * 100, 100);
  };

  const getStatusColor = () => {
    if (balance <= 1) return 'text-red-600';
    if (balance <= 3) return 'text-orange-600';
    if (balance <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = () => {
    if (balance <= 1) return <Badge variant="destructive" className="ml-2">Critique</Badge>;
    if (balance <= 3) return <Badge className="ml-2 bg-orange-100 text-orange-800">Faible</Badge>;
    return null;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        <span className={`font-medium ${getStatusColor()}`}>
          {balance}
        </span>
        <span className="text-xs text-muted-foreground">crédits</span>
        {isLowCredits() && <AlertTriangle className="w-4 h-4 text-orange-500" />}
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Crédits disponibles
              </span>
              {getStatusBadge()}
            </div>
            
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-bold ${getStatusColor()}`}>
                {balance}
              </span>
              {isRefreshing && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {showDetails && (
              <div className="space-y-2">
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      balance <= 10 ? 'bg-orange-500' : 'bg-primary'
                    }`}
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {balance <= 3 ? (
                    <span className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Solde faible - Pensez à recharger</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>≈ {Math.floor(balance / 2)} vidéos restantes</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {showActions && onBuyCredits && (
            <Button 
              size="sm" 
              onClick={onBuyCredits}
              className="flex items-center space-x-1"
              variant={balance <= 10 ? "default" : "outline"}
            >
              <Zap className="w-3 h-3" />
              <span>Recharger</span>
            </Button>
          )}
        </div>

        {/* Alerte critique */}
        {balance <= 1 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Crédits épuisés</p>
                <p className="text-red-600">
                  Vous ne pourrez plus générer de vidéos. Rechargez maintenant.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};