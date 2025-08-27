// backend/src/types/queue.types.ts - ASSUREZ-VOUS QUE CE FICHIER EXISTE
export interface VideoGenerationJobData {
  id: string;
  userId: string;
  imageUrl: string;
  productInfo: {
    name: string;
    description: string;
    price: number;
    category: string;
    targetAudience: string;
  };
  style: 'moderne' | 'luxe' | 'jeune' | 'professionnel' | 'b2b';
  voiceSettings: {
    voiceId: string;
    speed: number;
    pitch: number;
  };
  duration: number; // en secondes
  createdAt: Date;
}

export interface JobProgress {
  percentage: number;
  stage: 'validation' | 'script_generation' | 'voice_generation' | 'video_generation' | 'assembly' | 'completed';
  message: string;
  estimatedTimeRemaining?: number; // en secondes
  logs: JobLog[];
}

export interface JobLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}