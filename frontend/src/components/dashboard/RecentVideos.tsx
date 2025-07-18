import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Play, 
  Download, 
  Share2, 
  Clock, 
  Eye,
  MoreHorizontal,
  Video
} from 'lucide-react';
import { RecentVideo } from '../../types/video.types'; // ← Import depuis types
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/Dropdown-menu';

interface RecentVideosProps {
  videos: RecentVideo[];
  isLoading?: boolean;
}

export const RecentVideos: React.FC<RecentVideosProps> = ({ videos, isLoading }) => {
  const getStatusBadge = (status: RecentVideo['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1h';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40 mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="w-16 h-12 bg-muted rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-48"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Si pas de vidéos, afficher un message d'attente
  if (!videos || videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Vidéos récentes
            <Button variant="ghost" size="sm" disabled>
              Voir tout
            </Button>
          </CardTitle>
          <CardDescription>
            Vos dernières vidéos générées apparaîtront ici
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Aucune vidéo générée pour le moment
            </p>
            <p className="text-xs text-muted-foreground">
              L'affichage des vidéos sera disponible après l'implémentation de l'API vidéos (JOUR 3-4)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Vidéos récentes
          <Button variant="ghost" size="sm">
            Voir tout
          </Button>
        </CardTitle>
        <CardDescription>
          Vos {videos.length} dernières vidéos générées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {videos.map((video, index) => (
          <div 
            key={video.id} 
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInLeft 0.5s ease-out forwards'
            }}
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-12 bg-muted rounded overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              {video.status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium truncate">{video.title}</h4>
                {getStatusBadge(video.status)}
              </div>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {video.duration}
                </span>
                {video.views > 0 && (
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {video.views.toLocaleString()}
                  </span>
                )}
                <span>{formatDate(video.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {video.status === 'completed' && (
                <>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Share2 className="w-3 h-3" />
                  </Button>
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Renommer</DropdownMenuItem>
                  <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};