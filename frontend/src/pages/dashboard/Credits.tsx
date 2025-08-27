// frontend/src/pages/dashboard/Credits.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CreditCounter } from '../../components/credits/CreditCounter';
import { BuyCreditsModal } from '../../components/credits/BuyCreditsModal';
import { CreditHistory } from '../../components/credits/CreditHistory';
import { CreditUsageChart } from '../../components/credits/CreditUsageChart';
import { 
  Zap, 
  TrendingUp, 
  Video,
  Sparkles,
  Calculator,
  Gift,
  AlertTriangle,
  Target,
  Crown,
  Clock
} from 'lucide-react';
import { useCredits } from '../../hooks/useCredits';
import { useCreditUsage } from '../../hooks/useCreditUsage ';
import { useAuth } from '../../contexts/AuthContext';
import { CreditsApiService } from '../../services/credits.service';

export const Credits: React.FC = () => {
  const { user } = useAuth();
  const { balance, consumeCredits, isLowCredits } = useCredits();
  const { data: usageData, stats: usageStats } = useCreditUsage(30);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const videoTypes = [
    {
      name: 'Vidéo simple',
      credits: 1,
      description: 'Image + transitions basiques',
      icon: Video,
      examples: 'Photo produit, logo animé',
      color: 'text-blue-600'
    },
    {
      name: 'Vidéo avec voix-off',
      credits: 2,
      description: 'Image + voix IA + musique',
      icon: Sparkles,
      examples: 'Présentation produit, publicité',
      color: 'text-purple-600'
    },
    {
      name: 'Vidéo premium',
      credits: 3,
      description: 'Multi-angles + effets avancés',
      icon: Crown,
      examples: 'Campagne marketing, storytelling',
      color: 'text-amber-600'
    }
  ];

  // Charger les recommandations d'achat
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) return;
      
      setIsLoadingRecommendations(true); // ✅ Utilisation de setIsLoadingRecommendations
      try {
        const recs = await CreditsApiService.getPurchaseRecommendations();
        setRecommendations(recs);
      } catch (error) {
        console.error('Erreur chargement recommandations:', error);
      } finally {
        setIsLoadingRecommendations(false); // ✅ Utilisation de setIsLoadingRecommendations
      }
    };

    loadRecommendations();
  }, [user, balance]);

  const handleTestConsume = async (amount: number) => {
    try {
      await consumeCredits({
        amount,
        reason: `Test consommation ${amount} crédit${amount > 1 ? 's' : ''}`,
        metadata: {
          description: 'Test depuis tableau de bord crédits'
        }
      });
    } catch (error) {
      console.error('Erreur test consommation:', error);
    }
  };

  const handlePurchase = (packageId: string) => {
    console.log('Purchase package:', packageId);
    // TODO: Intégration Stripe
    setShowBuyModal(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-orange-500 bg-orange-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'low': return <Target className="w-5 h-5 text-blue-600" />;
      default: return <Target className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord crédits</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos crédits et suivez votre consommation en temps réel.
          </p>
        </div>
        
        <Button 
          onClick={() => setShowBuyModal(true)} 
          size="lg"
          className={isLowCredits() ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          <Zap className="w-4 h-4 mr-2" />
          {isLowCredits() ? 'Recharger maintenant' : 'Acheter des crédits'}
        </Button>
      </div>

      {/* Section d'état de chargement des recommandations */}
      {isLoadingRecommendations && (
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="font-semibold">Chargement des recommandations...</h3>
                <p className="text-muted-foreground text-sm">Analyse de votre usage en cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {recommendations && recommendations.recommended && !isLoadingRecommendations && (
        <Card className={`border-2 ${getUrgencyColor(recommendations.urgency)}`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              {getUrgencyIcon(recommendations.urgency)}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Recommandation d'achat</h3>
                <p className="text-muted-foreground mt-1">{recommendations.reason}</p>
                {recommendations.suggestedAmount > 0 && (
                  <p className="text-sm mt-2">
                    <strong>Suggestion:</strong> Rechargez environ {recommendations.suggestedAmount} crédits
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-3">
                  <Button 
                    onClick={() => setShowBuyModal(true)}
                    size="sm"
                    variant={recommendations.urgency === 'high' ? 'default' : 'outline'}
                  >
                    Voir les offres
                  </Button>
                  <Badge variant={recommendations.urgency === 'high' ? 'destructive' : 'secondary'}>
                    Priorité {recommendations.urgency === 'high' ? 'haute' : recommendations.urgency === 'medium' ? 'moyenne' : 'faible'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section principale */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Colonne gauche - Solde et actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Credit Counter */}
          <CreditCounter 
            onBuyCredits={() => setShowBuyModal(true)} 
            showDetails={true}
            showActions={true}
          />

          {/* Plan actuel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <span>Plan actuel</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge variant="outline" className="capitalize">
                    {user?.plan || 'Free'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Crédits inclus</span>
                  <span className="font-medium">10 / mois</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Renouvellement</span>
                  <span className="font-medium text-green-600">Gratuit</span>
                </div>

                <Button variant="outline" className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Découvrir Premium
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tests développement */}
          {process.env.NODE_ENV === 'development' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tests (Dev)</CardTitle>
                <CardDescription className="text-xs">
                  Fonctions de test pour le développement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConsume(1)}
                  className="w-full"
                  disabled={balance < 1}
                >
                  Test -1 crédit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConsume(2)}
                  className="w-full"
                  disabled={balance < 2}
                >
                  Test -2 crédits
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConsume(5)}
                  className="w-full"
                  disabled={balance < 5}
                >
                  Test -5 crédits
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonnes droites - Graphiques et analyses */}
        <div className="lg:col-span-3 space-y-6">
          {/* Graphique d'usage avec les vraies données */}
          <CreditUsageChart
            data={usageData} // ✅ Utilisation de usageData
            period={30}
            showStats={true}
            showPredictions={true}
            currentBalance={balance}
          />

          {/* Calculateur de coûts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Coût par type de vidéo</span>
              </CardTitle>
              <CardDescription>
                Estimez vos besoins selon le type de contenu que vous créez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videoTypes.map((type) => (
                  <div
                    key={type.name}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <type.icon className={`w-5 h-5 ${type.color}`} />
                        <span className="font-medium">{type.name}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ex: {type.examples}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${type.color}`}>
                          {type.credits} crédit{type.credits > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ≈ {Math.floor(balance / type.credits)} vidéos
                        </span>
                      </div>

                      {/* Indicateur de capacité */}
                      <div className="w-full bg-muted rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-300 ${
                            balance >= type.credits ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min((balance / type.credits) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Astuce :</strong> Les vidéos avec voix-off génèrent 3x plus d'engagement 
                  mais consomment plus de crédits
                </p>
              </div>

              {/* Statistiques rapides */}
              {usageStats && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Consommation moyenne</p>
                    <p className="text-sm font-semibold">
                      {usageStats.avgDailyConsumption.toFixed(1)}/jour
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total consommé</p>
                    <p className="text-sm font-semibold text-red-600">
                      {usageStats.totalConsumed}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total ajouté</p>
                    <p className="text-sm font-semibold text-green-600">
                      {usageStats.totalAdded}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Tendance</p>
                    <div className="flex items-center justify-center">
                      <TrendingUp className={`w-3 h-3 mr-1 ${
                        usageStats.trend === 'increasing' ? 'text-red-500' : 
                        usageStats.trend === 'decreasing' ? 'text-green-500' : 
                        'text-gray-500'
                      }`} />
                      <span className="text-xs capitalize">{usageStats.trend}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique des transactions */}
          <CreditHistory />
        </div>
      </div>

      {/* Modal d'achat */}
      <BuyCreditsModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onPurchase={handlePurchase}
      />
    </div>
  );
};