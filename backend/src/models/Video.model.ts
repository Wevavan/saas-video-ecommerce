// backend/src/models/Video.model.ts - VERSION FUSIONNÉE
import mongoose, { Document, Schema } from 'mongoose';

export enum VideoGenerationStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  
  // ✅ TES PROPRIÉTÉS EXISTANTES (gardées)
  url?: string;
  thumbnail?: string;
  templateId?: string;
  settings?: Record<string, any>;
  
  // Image source
  inputImageUrl: string;
  
  // Generation parameters
  style: string;
  prompt?: string;
  
  // 🆕 PROPRIÉTÉS IA AJOUTÉES pour le controller
  jobId?: string;              // ID du job dans la queue
  script?: string;             // Script généré par OpenAI
  outputVideo?: string;        // Vidéo finale générée (alias de videoUrl)
  inputImage?: string;         // Alias de inputImageUrl pour compatibilité
  
  // Runway integration
  runwayJobId?: string;
  runwayTaskId?: string; // Alias pour compatibilité
  status: VideoGenerationStatus;
  progress: number;
  
  // Generation timing
  generationStartedAt?: Date;
  generationEndedAt?: Date;
  lastPolledAt?: Date;
  
  // Results
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null; // in seconds
  
  // Error handling
  error?: string;
  
  // Tracking and monitoring
  pollingAttempts?: number;
  pollingErrors?: number;
  
  // Credits and billing
  creditsUsed: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  // Metadata with proper typing
  metadata?: {
    // ✅ TES PROPRIÉTÉS EXISTANTES
    resolution?: string;
    format?: string;
    size?: number;
    
    // 🆕 PROPRIÉTÉS IA AJOUTÉES
    model?: string;
    promptTemplate?: string;
    creditCost?: number;
    runwayJobId?: string;
    originalVideoId?: string;
    productInfo?: {
      name?: string;
      price?: number;
      category?: string;
      description?: string;
    };
    generationSettings?: {
      duration?: number;
      ratio?: string;
      seed?: number;
    };
    performance?: {
      startTime?: Date;
      endTime?: Date;
      totalTime?: number;
    };
    runwayResponse?: any;
    lastStatus?: any;
  };
  
  // User interaction
  isPublic: boolean;
  isFavorite: boolean;
  tags: string[];
  
  // Analytics
  views: number;
  downloads: number;
  shares: number;
  
  // Instance methods
  isComplete(): boolean;
  isFailed(): boolean;
  isProcessing(): boolean;
  incrementView(): Promise<any>;
  incrementDownload(): Promise<any>;
  incrementShare(): Promise<any>;
}

const VideoSchema = new Schema<IVideo>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // ✅ TES PROPRIÉTÉS EXISTANTES (gardées)
  url: {
    type: String,
    trim: true
  },
  
  thumbnail: {
    type: String,
    trim: true
  },
  
  templateId: {
    type: String,
    trim: true
  },
  
  settings: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  inputImageUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  },
  
  // 🆕 PROPRIÉTÉS IA AJOUTÉES
  jobId: {
    type: String,
    trim: true,
    index: true,
    sparse: true
  },
  
  script: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  outputVideo: {
    type: String,
    trim: true
  },
  
  inputImage: {
    type: String,
    trim: true
  },
  
  style: {
    type: String,
    required: true,
    enum: [
      // ✅ Styles existants gardés
      'modern', 'luxe', 'young', 'professional', 'b2b', 
      'cinematic', 'realistic', 'artistic', 'fast_motion', 
      'slow_motion', 'dreamy', 'vintage', 'creative', 'default',
      // 🆕 Styles IA ajoutés
      'moderne', 'jeune', 'professionnel'
    ],
    default: 'default'
  },
  
  prompt: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Runway integration
  runwayJobId: {
    type: String,
    sparse: true,
    index: true
  },
  
  runwayTaskId: {
    type: String,
    sparse: true,
    index: true
  },
  
  status: {
    type: String,
    enum: Object.values(VideoGenerationStatus),
    default: VideoGenerationStatus.QUEUED,
    index: true
  },
  
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Generation timing
  generationStartedAt: {
    type: Date,
    index: true
  },
  
  generationEndedAt: {
    type: Date,
    index: true
  },
  
  lastPolledAt: {
    type: Date
  },
  
  // Results
  videoUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(mp4|mov|avi|webm)(\?.*)?$/i.test(v);
      },
      message: 'Invalid video URL format'
    }
  },
  
  thumbnailUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(v);
      },
      message: 'Invalid thumbnail URL format'
    }
  },
  
  duration: {
    type: Number,
    default: null,
    min: 0,
    max: 300 // 5 minutes max
  },
  
  error: {
    type: String,
    maxlength: 1000
  },
  
  // Polling tracking
  pollingAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  
  pollingErrors: {
    type: Number,
    default: 0,
    min: 0
  },
  
  creditsUsed: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date,
    index: true
  },
  
  failedAt: {
    type: Date,
    index: true
  },
  
  // Metadata avec structure complète
  metadata: {
    // ✅ TES PROPRIÉTÉS EXISTANTES
    resolution: String,
    format: String,
    size: Number,
    
    // 🆕 PROPRIÉTÉS IA AJOUTÉES
    model: String,
    promptTemplate: String,
    creditCost: Number,
    runwayJobId: String,
    originalVideoId: String,
    productInfo: {
      name: String,
      price: Number,
      category: String,
      description: String
    },
    generationSettings: {
      duration: Number,
      ratio: String,
      seed: Number
    },
    performance: {
      startTime: Date,
      endTime: Date,
      totalTime: Number
    },
    runwayResponse: Schema.Types.Mixed,
    lastStatus: Schema.Types.Mixed
  },
  
  // User interaction
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Analytics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  downloads: {
    type: Number,
    default: 0,
    min: 0
  },
  
  shares: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ TES INDEX EXISTANTS + NOUVEAUX
VideoSchema.index({ userId: 1, createdAt: -1 });
VideoSchema.index({ status: 1, createdAt: -1 });
VideoSchema.index({ runwayJobId: 1 }, { sparse: true });
VideoSchema.index({ userId: 1, status: 1 });
VideoSchema.index({ userId: 1, isFavorite: 1 });
VideoSchema.index({ isPublic: 1, createdAt: -1 });
VideoSchema.index({ tags: 1 });
VideoSchema.index({ status: 1, runwayJobId: 1 });
VideoSchema.index({ generationStartedAt: 1 });
// 🆕 NOUVEAUX INDEX POUR IA
VideoSchema.index({ jobId: 1, userId: 1 }, { sparse: true });

// ✅ TES VIRTUELS EXISTANTS + NOUVEAUX
VideoSchema.virtual('generationTime').get(function() {
  const doc = this as IVideo;
  if (doc.generationEndedAt && doc.generationStartedAt) {
    return doc.generationEndedAt.getTime() - doc.generationStartedAt.getTime();
  }
  return null;
});

VideoSchema.virtual('statusDisplay').get(function() {
  const doc = this as IVideo;
  const statusMap: Record<VideoGenerationStatus, string> = {
    [VideoGenerationStatus.QUEUED]: 'En attente',
    [VideoGenerationStatus.PROCESSING]: 'En cours',
    [VideoGenerationStatus.COMPLETED]: 'Terminé',
    [VideoGenerationStatus.FAILED]: 'Échoué',
    [VideoGenerationStatus.TIMEOUT]: 'Timeout'
  };
  return statusMap[doc.status] || doc.status;
});

// 🆕 VIRTUELS POUR COMPATIBILITÉ IA
VideoSchema.virtual('isAiGenerated').get(function() {
  const doc = this as IVideo;
  return !!doc.jobId;
});

// ✅ TES MIDDLEWARES EXISTANTS (gardés)
VideoSchema.pre('save', function(next: (err?: Error) => void) {
  const doc = this as IVideo;
  doc.updatedAt = new Date();
  
  // Set completion/failure timestamps
  if (doc.isModified('status')) {
    if (doc.status === VideoGenerationStatus.COMPLETED && !doc.completedAt) {
      doc.completedAt = new Date();
      doc.generationEndedAt = new Date();
      doc.progress = 100;
    } else if (doc.status === VideoGenerationStatus.FAILED && !doc.failedAt) {
      doc.failedAt = new Date();
      doc.generationEndedAt = new Date();
    }
  }
  
  // 🆕 SYNCHRONISATION outputVideo ↔ videoUrl
  if (doc.isModified('videoUrl') && doc.videoUrl && !doc.outputVideo) {
    doc.outputVideo = doc.videoUrl;
  }
  if (doc.isModified('outputVideo') && doc.outputVideo && !doc.videoUrl) {
    doc.videoUrl = doc.outputVideo;
  }
  
  // 🆕 SYNCHRONISATION inputImage ↔ inputImageUrl
  if (doc.isModified('inputImageUrl') && doc.inputImageUrl && !doc.inputImage) {
    doc.inputImage = doc.inputImageUrl;
  }
  if (doc.isModified('inputImage') && doc.inputImage && !doc.inputImageUrl) {
    doc.inputImageUrl = doc.inputImage;
  }
  
  next();
});

// ✅ TES MÉTHODES STATIQUES EXISTANTES (gardées)
VideoSchema.statics.findByUser = function(userId: string, options: any = {}) {
  return this.find({ userId, ...options }).sort({ createdAt: -1 });
};

VideoSchema.statics.findByStatus = function(status: VideoGenerationStatus, limit: number = 50) {
  return this.find({ status }).limit(limit).sort({ createdAt: -1 });
};

VideoSchema.statics.findActiveGenerations = function() {
  return this.find({
    status: { $in: [VideoGenerationStatus.QUEUED, VideoGenerationStatus.PROCESSING] },
    runwayJobId: { $exists: true, $ne: null }
  });
};

VideoSchema.statics.getStatsForUser = function(userId: string, startDate?: Date) {
  const match: any = { userId };
  if (startDate) {
    match.createdAt = { $gte: startDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', VideoGenerationStatus.COMPLETED] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', VideoGenerationStatus.FAILED] }, 1, 0] }
        },
        processing: {
          $sum: { $cond: [{ $eq: ['$status', VideoGenerationStatus.PROCESSING] }, 1, 0] }
        },
        totalCredits: { $sum: '$creditsUsed' },
        avgGenerationTime: { $avg: '$generationTime' }
      }
    }
  ]);
};

// 🆕 NOUVELLES MÉTHODES STATIQUES POUR IA
VideoSchema.statics.findByJobId = function(jobId: string) {
  return this.findOne({ jobId });
};

VideoSchema.statics.findAiVideos = function(userId: string) {
  return this.find({ userId, jobId: { $exists: true, $ne: null } }).sort({ createdAt: -1 });
};

// ✅ TES MÉTHODES D'INSTANCE EXISTANTES (gardées)
VideoSchema.methods.isComplete = function(): boolean {
  const doc = this as IVideo;
  return doc.status === VideoGenerationStatus.COMPLETED;
};

VideoSchema.methods.isFailed = function(): boolean {
  const doc = this as IVideo;
  return doc.status === VideoGenerationStatus.FAILED;
};

VideoSchema.methods.isProcessing = function(): boolean {
  const doc = this as IVideo;
  return doc.status === VideoGenerationStatus.PROCESSING || doc.status === VideoGenerationStatus.QUEUED;
};

VideoSchema.methods.incrementView = function() {
  return this.updateOne({ $inc: { views: 1 } });
};

VideoSchema.methods.incrementDownload = function() {
  return this.updateOne({ $inc: { downloads: 1 } });
};

VideoSchema.methods.incrementShare = function() {
  return this.updateOne({ $inc: { shares: 1 } });
};

export const Video = mongoose.model<IVideo>('Video', VideoSchema);