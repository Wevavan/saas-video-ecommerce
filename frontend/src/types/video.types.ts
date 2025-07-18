export interface Video {
  id: string
  title: string
  description?: string
  thumbnail?: string
  url: string
  duration: number
  status: 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  userId: string
  metadata?: {
    resolution: string
    format: string
    size: number
  }
}

export interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  isLoading: boolean
  error: string | null
}

export interface CreateVideoRequest {
  title: string
  description?: string
  template?: string
  settings?: Record<string, any>
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
