import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalname: string;
  size: number;
  format: string;
  mimetype: string;
  url: string;
  uploadedAt: Date;
  deletedAt?: Date | null;
}

const ImageSchema = new Schema<IImage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalname: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  format: {
    type: String,
    required: true,
    enum: ['jpg', 'jpeg', 'png', 'webp'],
    lowercase: true
  },
  mimetype: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  },
  url: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  collection: 'images'
});

// Index composé optimisé
ImageSchema.index({ userId: 1, deletedAt: 1, uploadedAt: -1 });

export const Image = mongoose.model<IImage>('Image', ImageSchema);