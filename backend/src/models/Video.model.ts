import mongoose, { Schema } from 'mongoose'

export interface IVideo extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  title: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  inputImage: {
    url: string
    filename: string
    size: number
    mimeType: string
  }
  outputVideo?: {
    url: string
    filename: string
    size: number
    duration: number
    resolution: string
    format: string
  }
  style: {
    template: string
    settings: Record<string, any>
    music?: string
    voiceover?: string
  }
  processing: {
    jobId?: string
    progress: number
    startedAt?: Date
    completedAt?: Date
    errorMessage?: string
  }
  metadata: {
    ipAddress?: string
    userAgent?: string
    referrer?: string
  }
  analytics: {
    views: number
    downloads: number
    shares: number
  }
  isPublic: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const videoSchema = new Schema<IVideo>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID utilisateur requis'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Titre requis'],
    trim: true,
    maxlength: [200, 'Titre maximum 200 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description maximum 1000 caractères']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      message: 'Statut invalide'
    },
    default: 'pending',
    index: true
  },
  inputImage: {
    url: {
      type: String,
      required: [true, 'URL de l\'image requise']
    },
    filename: {
      type: String,
      required: [true, 'Nom de fichier requis']
    },
    size: {
      type: Number,
      required: [true, 'Taille du fichier requise'],
      min: [0, 'Taille invalide']
    },
    mimeType: {
      type: String,
      required: [true, 'Type MIME requis'],
      enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }
  },
  outputVideo: {
    url: String,
    filename: String,
    size: {
      type: Number,
      min: [0, 'Taille invalide']
    },
    duration: {
      type: Number,
      min: [0, 'Durée invalide']
    },
    resolution: {
      type: String,
      enum: ['720p', '1080p', '4K'],
      default: '1080p'
    },
    format: {
      type: String,
      enum: ['mp4', 'mov', 'avi'],
      default: 'mp4'
    }
  },
  style: {
    template: {
      type: String,
      required: [true, 'Template requis'],
      enum: ['slideshow', 'zoom', 'parallax', 'fade', 'custom']
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {}
    },
    music: String,
    voiceover: String
  },
  processing: {
    jobId: String,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    startedAt: Date,
    completedAt: Date,
    errorMessage: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  analytics: {
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
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }]
}, {
  timestamps: true
})

// Index pour performance
videoSchema.index({ userId: 1, createdAt: -1 })
videoSchema.index({ status: 1 })
videoSchema.index({ 'style.template': 1 })
videoSchema.index({ isPublic: 1, createdAt: -1 })
videoSchema.index({ tags: 1 })
videoSchema.index({ 'processing.jobId': 1 })

// Index composé pour les requêtes fréquentes
videoSchema.index({ userId: 1, status: 1 })

export const Video = mongoose.model<IVideo>('Video', videoSchema)