// src/types/audio/elevenlabs.types.ts
export interface VoiceSettings {
  stability: number; // 0-1, stabilité de la voix
  similarity_boost: number; // 0-1, boost de similarité
  style?: number; // 0-1, style expressif (optionnel)
  use_speaker_boost?: boolean; // Amplification du speaker
}

export interface AudioGenerationConfig {
  text: string;
  voice_id: string;
  voice_settings?: VoiceSettings;
  model_id?: string;
  language_code?: string;
  pronunciation_dictionary_locators?: string[];
}

export interface AudioGenerationResult {
  success: boolean;
  audioUrl?: string;
  audioPath?: string;
  duration?: number;
  fileSize?: number;
  charactersUsed: number;
  creditsUsed: number;
  voiceUsed: string;
  error?: string;
}

export interface VoiceInfo {
  voice_id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  accent: string;
  description: string;
  use_case: string[];
  premium?: boolean;
}

// Enum des voix supportées avec leurs IDs réels ElevenLabs
export enum SupportedVoices {
  // Voix françaises
  FRENCH_MALE_1 = "pNInz6obpgDQGcFmaJgB", // Adam (anglais mais adapté)
  FRENCH_FEMALE_1 = "EXAVITQu4vr4xnSDxMaL", // Bella (anglais mais adapté)
  
  // Voix anglaises
  ENGLISH_MALE_1 = "pNInz6obpgDQGcFmaJgB", // Adam
  ENGLISH_FEMALE_1 = "EXAVITQu4vr4xnSDxMaL", // Bella
  
  // Voix espagnoles
  SPANISH_MALE_1 = "VR6AewLTigWG4xSOukaG", // Antoni
  SPANISH_FEMALE_1 = "EXAVITQu4vr4xnSDxMaL", // Bella (adaptée)
}

export interface CachedAudio {
  audioPath: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  voiceId: string;
  text: string;
  textHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ElevenLabsServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  apiKeyConfigured: boolean;
  charactersRemaining?: number;
  subscriptionPlan?: string;
  lastSuccessfulCall?: Date;
  errorCount: number;
  responseTime?: number;
}

export interface AudioOptimizationSettings {
  bitrate?: number; // Bitrate en kbps (64, 128, 192, 256)
  sampleRate?: number; // Sample rate en Hz (22050, 44100, 48000)
  format?: 'mp3' | 'wav' | 'ogg';
  normalize?: boolean; // Normaliser le volume
  compress?: boolean; // Compression audio
}

export interface TextToSpeechRequest {
  text: string;
  voiceId: keyof typeof SupportedVoices | string;
  settings?: Partial<VoiceSettings>;
  optimization?: AudioOptimizationSettings;
  cacheKey?: string;
}

export interface AudioMetrics {
  totalGenerations: number;
  totalCharacters: number;
  totalCreditsUsed: number;
  averageDuration: number;
  cacheHitRate: number;
  popularVoices: Record<string, number>;
  errorRate: number;
}

// Paramètres optimaux par cas d'usage
export const VOICE_PRESETS = {
  COMMERCIAL: {
    stability: 0.75,
    similarity_boost: 0.85,
    style: 0.2,
    use_speaker_boost: true,
  },
  NARRATIVE: {
    stability: 0.85,
    similarity_boost: 0.75,
    style: 0.4,
    use_speaker_boost: false,
  },
  CONVERSATIONAL: {
    stability: 0.65,
    similarity_boost: 0.8,
    style: 0.6,
    use_speaker_boost: true,
  },
  PROFESSIONAL: {
    stability: 0.9,
    similarity_boost: 0.9,
    style: 0.1,
    use_speaker_boost: false,
  },
} as const;

export type VoicePreset = keyof typeof VOICE_PRESETS;