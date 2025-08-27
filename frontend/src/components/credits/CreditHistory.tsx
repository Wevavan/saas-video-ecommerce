// frontend/src/components/credits/CreditHistory.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Minus,
  Calendar,
} from 'lucide-react';
import { useCredits } from '../../hooks/useCredits';
import { CreditTransaction } from '../../types/credits.types';

export const CreditHistory: React.FC = () => {
  const { history, loadHistory, isLoading } = useCredits();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    loadHistory({ 
      page: currentPage, 
      limit: 10, 
      type: filter === 'all' ? undefined : filter 
    });
  }, [currentPage, filter, loadHistory]);

  const getTransactionIcon = (transaction: CreditTransaction) => {
    if (transaction.type === 'credit') {
      return <Plus className="w-4 h-4 text-green-600" />;
    } else {
      return <Minus className="w-4 h-4 text-red-600" />;
    }
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      registration: 'Inscription',
      purchase: 'Achat',
      video_generation: 'Génération vidéo',
      admin: 'Administrateur',
      refund: 'Remboursement',
      bonus: 'Bonus'
    };
    return labels[source as keyof typeof labels] || source;
  };

  const getSourceColor = (source: string) => {
    const colors = {
      registration: 'bg-blue-100 text-blue-800',
      purchase: 'bg-green-100 text-green-800',
      video_generation: 'bg-purple-100 text-purple-800',
      admin: 'bg-gray-100 text-gray-800',
      refund: 'bg-orange-100 text-orange-800',
      bonus: 'bg-yellow-100 text-yellow-800'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !history) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Historique des transactions</span>
            </CardTitle>
            <CardDescription>
              Suivez tous vos mouvements de crédits
            </CardDescription>
          </div>
          
          {/* Filtres */}
          <div className="flex items-center space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tout
            </Button>
            <Button
              variant={filter === 'credit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('credit')}
              className="text-green-600"
            >
              <Plus className="w-3 h-3 mr-1" />
              Crédits
            </Button>
            <Button
              variant={filter === 'debit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('debit')}
              className="text-red-600"
            >
              <Minus className="w-3 h-3 mr-1" />
              Débits
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {history?.transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Résumé */}
            {history?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total crédits ajoutés</p>
                  <p className="text-lg font-semibold text-green-600">+{history.summary.totalCredits}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total crédits consommés</p>
                  <p className="text-lg font-semibold text-red-600">-{history.summary.totalDebits}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Solde net</p>
                  <p className={`text-lg font-semibold ${history.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {history.summary.netBalance >= 0 ? '+' : ''}{history.summary.netBalance}
                  </p>
                </div>
              </div>
            )}

            {/* Liste des transactions */}
            <div className="space-y-3">
              {history?.transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(transaction)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {transaction.reason}
                        </p>
                        <Badge className={getSourceColor(transaction.source)}>
                          {getSourceLabel(transaction.source)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </span>
                        
                        {transaction.metadata?.description && (
                          <span className="truncate max-w-48">
                            {transaction.metadata.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solde: {transaction.balanceAfter}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {history?.pagination && history.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {history.pagination.currentPage} sur {history.pagination.totalPages}
                  • {history.pagination.totalCount} transactions
                </p>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={history.pagination.currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={history.pagination.currentPage === history.pagination.totalPages || isLoading}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};