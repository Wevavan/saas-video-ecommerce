import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { 
  CreditCard, 
  Zap, 
  Star, 
  Check,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { CreditPackage } from '../../types/credits.types';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase?: (packageId: string) => void;
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    credits: 100,
    price: 19,
    originalPrice: 25,
    description: 'Parfait pour commencer',
    savings: '24%'
  },
  {
    id: 'business',
    credits: 500,
    price: 79,
    originalPrice: 125,
    popular: true,
    description: 'Le plus populaire',
    savings: '37%'
  },
  {
    id: 'agency',
    credits: 1000,
    price: 149,
    originalPrice: 250,
    description: 'Maximum d\'économies',
    savings: '40%'
  }
];

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
  isOpen,
  onClose,
  onPurchase
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (packageId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedPackage(packageId);

    try {
      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onPurchase) {
        onPurchase(packageId);
      }
      
      // TODO: Intégrer Stripe ici
      console.log('Purchase package:', packageId);
      
    } catch (error) {
      console.error('Erreur achat:', error);
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getPricePerCredit = (credits: number, price: number) => {
    return (price / credits).toFixed(3);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Zap className="w-6 h-6 text-primary" />
            <span>Recharger vos crédits</span>
          </DialogTitle>
          <DialogDescription>
            Choisissez le package qui correspond à vos besoins. Plus vous achetez, plus vous économisez !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info pricing */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Estimation d'usage</p>
                <p className="text-blue-600">
                  1 crédit = 1 génération vidéo simple • 2 crédits = 1 vidéo avec voix-off
                </p>
              </div>
            </div>
          </div>

          {/* Packages grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
                  pkg.popular ? 'ring-2 ring-primary scale-105' : 'hover:scale-102'
                }`}
                onClick={() => !isProcessing && handlePurchase(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Plus populaire
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="text-lg font-semibold">{pkg.credits} crédits</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    </div>

                    {/* Prix */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl font-bold">{formatPrice(pkg.price)}</span>
                        {pkg.originalPrice && (
                          <span className="text-lg text-muted-foreground line-through">
                            {formatPrice(pkg.originalPrice)}
                          </span>
                        )}
                      </div>
                      
                      {pkg.savings && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          -{pkg.savings} d'économie
                        </Badge>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {getPricePerCredit(pkg.credits, pkg.price)}€ par crédit
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>≈ {Math.floor(pkg.credits / 2)} vidéos avec voix</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Crédits sans expiration</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Support prioritaire</span>
                      </div>
                    </div>

                    {/* Bouton d'achat */}
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={isProcessing}
                      variant={pkg.popular ? "default" : "outline"}
                    >
                      {isProcessing && selectedPackage === pkg.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Traitement...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4" />
                          <span>Acheter maintenant</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Informations légales */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Paiement sécurisé par Stripe • Remboursement sous 30 jours</p>
            <p>TVA incluse • Facture automatique par email</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};