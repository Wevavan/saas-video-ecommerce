// backend/src/types/bull-fix.types.ts - Types manquants pour Bull
import Bull from 'bull';

// ✅ Interface pour corriger le problème de progress
export interface ExtendedBullJob<T = any> extends Bull.Job<T> {
  progress(): any;
  progress(value: any): Promise<void>;
}

// ✅ Options de job corrigées pour éviter les erreurs TypeScript
export interface SafeJobOptions extends Omit<Bull.JobOptions, 'backoff'> {
  backoff?: {
    type: 'fixed' | 'exponential';
    delay?: number;
    settings?: any;
  };
}