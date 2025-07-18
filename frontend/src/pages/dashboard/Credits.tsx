import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CreditCounter } from '../../components/credits/CreditCounter';
import { BuyCreditsModal } from '../../components/credits/BuyCreditsModal';
import { CreditHistory } from '../../components/credits/CreditHistory';
import { 
  Zap, 
  TrendingUp, 
  Video,
  Sparkles,
  Calculator,
  Gift
} from 'lucide-react';
import { useCredits } from '../../hooks/useCredits';
import { useAuth } from '../../contexts/AuthContext';

export const Credits: React.FC = () => {
  const { user } = useAuth();
  const { balance, consumeCredits } = useCredits();
  const [showBuyModal, setShowBuyModal] = useState(false);

  const videoTypes = [
    {
      name: 'Vidéo simple',
      credits: 1,
      description: 'Image + transitions basiques',
      icon: Video,
      examples: 'Photo produit, logo animé'
    },
    {
      name: 'Vidéo avec voix-off',
      credits: 2,
      description: 'Image + voix IA + musique',
      icon: Sparkles,
      examples: 'Présentation produit, publicité'
    },
    {
      name: 'Vidéo premium',
      credits: 3,
      description: 'Multi-angles + effets avancés',
      icon: TrendingUp,
      examples: 'Campagne marketing, storytelling'
    }
  ];

  const handleTestConsume = async (amount: number) => {
    try {
      await consumeCredits({
        amount,
        reason: `Test consommation ${amount} crédit${amount > 1 ? 's' : ''}`,
        metadata: {
          description: 'Test depuis interface utilisateur'
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestion des crédits</h1>
          <p className="text-muted-foreground mt-1">
            Suivez votre consommation et rechargez votre compte facilement.
          </p>
        </div>
        
        <Button onClick={() => setShowBuyModal(true)} size="lg">
          <Zap className="w-4 h-4 mr-2" />
          Acheter des crédits
        </Button>
      </div>

      {/* Section principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Solde et actions */}
        <div className="space-y-6">
          {/* Credit Counter */}
          <CreditCounter onBuyCredits={() => setShowBuyModal(true)} />

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
                  <span className="font-medium capitalize">{user?.plan || 'Free'}</span>
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
                  Découvrir les plans premium
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tests (développement) */}
          {process.env.NODE_ENV === 'development' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tests (Dev only)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConsume(1)}
                  className="w-full"
                >
                  Test -1 crédit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConsume(2)}
                  className="w-full"
                >
                  Test -2 crédits
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne droite - Coûts et historique */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calculateur de coûts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Coût par type de vidéo</span>
              </CardTitle>
              <CardDescription>
                Estimez vos besoins selon le type de contenu
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
                        <type.icon className="w-5 h-5 text-primary" />
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
                        <span className="text-lg font-bold text-primary">
                          {type.credits} crédit{type.credits > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ≈ {Math.floor(balance / type.credits)} vidéos
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Astuce :</strong> Les vidéos avec voix-off génèrent 3x plus d'engagement
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Historique */}
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