import { useState, useEffect } from 'react';

export interface DashboardStats {
  videosGenerated: number;
  creditsUsed: number;
  timesSaved: number;
  totalViews: number;
  conversationRate: number;
  planUsage: {
    current: number;
    limit: number;
  };
}

export interface VideoUsageData {
  date: string;
  videos: number;
  credits: number;
}

export interface RecentVideo {
  id: string;
  title: string;
  thumbnail: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  views: number;
  duration: string;
}

export interface StatsData {
  stats: DashboardStats;
  usageData: VideoUsageData[];
  recentVideos: RecentVideo[];
}

export const useStats = () => {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulation d'appel API avec délai
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Données mockées réalistes
        const mockData: StatsData = {
          stats: {
            videosGenerated: 3,
            creditsUsed: 6,
            timesSaved: 2.5,
            totalViews: 847,
            conversationRate: 12.4,
            planUsage: {
              current: 3,
              limit: 10
            }
          },
          usageData: [
            { date: '2024-07-12', videos: 2, credits: 4 },
            { date: '2024-07-13', videos: 5, credits: 10 },
            { date: '2024-07-14', videos: 1, credits: 2 },
            { date: '2024-07-15', videos: 8, credits: 16 },
            { date: '2024-07-16', videos: 3, credits: 6 },
            { date: '2024-07-17', videos: 4, credits: 8 },
            { date: '2024-07-18', videos: 0, credits: 0 }
          ],
          recentVideos: [
            {
              id: '1',
              title: 'iPhone 15 Pro - Présentation',
              thumbnail: '/api/placeholder/300/200',
              status: 'completed',
              createdAt: '2024-07-17T14:30:00Z',
              views: 432,
              duration: '0:30'
            },
            {
              id: '2',
              title: 'Sneakers Nike Air Max',
              thumbnail: '/api/placeholder/300/200',
              status: 'completed',
              createdAt: '2024-07-17T10:15:00Z',
              views: 289,
              duration: '0:25'
            },
            {
              id: '3',
              title: 'Montre connectée Samsung',
              thumbnail: '/api/placeholder/300/200',
              status: 'processing',
              createdAt: '2024-07-17T08:45:00Z',
              views: 0,
              duration: '0:28'
            },
            {
              id: '4',
              title: 'Casque audio Bose',
              thumbnail: '/api/placeholder/300/200',
              status: 'completed',
              createdAt: '2024-07-16T16:20:00Z',
              views: 156,
              duration: '0:22'
            },
            {
              id: '5',
              title: 'Laptop MacBook Pro',
              thumbnail: '/api/placeholder/300/200',
              status: 'failed',
              createdAt: '2024-07-16T11:30:00Z',
              views: 0,
              duration: '0:35'
            }
          ]
        };

        setData(mockData);
      } catch (err) {
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refreshStats = () => {
    setData(null);
    setIsLoading(true);
    // Re-trigger useEffect
  };

  return {
    data,
    isLoading,
    error,
    refreshStats
  };
};