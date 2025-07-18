import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Play, Download, Share } from 'lucide-react';

export const Videos: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mes vidéos</h1>
          <p className="text-muted-foreground">
            Gérez et téléchargez vos vidéos générées.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle vidéo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-2">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Produit {i}</CardTitle>
              <CardDescription>
                Vidéo générée il y a {i} jour{i > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Play className="w-3 h-3 mr-1" />
                    Voir
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3 mr-1" />
                    Télécharger
                  </Button>
                </div>
                <Button size="sm" variant="ghost">
                  <Share className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};