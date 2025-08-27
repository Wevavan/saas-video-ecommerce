// backend/src/types/runway.types.ts
export enum VideoGenerationStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

export interface RunwayGenerationRequest {
  imageUrl: string;
  prompt: string;
  style: string;
  duration?: number;
  aspectRatio?: string;
  seed?: number;
}

export interface RunwayResponse {
  id: string;
  status: VideoGenerationStatus;
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: any;
}

export interface RunwayConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  pollingInterval: number;
}

export interface RunwayJobData {
  userId: string;
  videoId: string;
  request: RunwayGenerationRequest;
  runwayJobId?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastPolledAt?: Date;
}