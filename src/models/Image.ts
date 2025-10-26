import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Image document
export interface IImage extends Document {
  filename: string;
  url: string;
  description?: string;
  uploadedBy?: string;
  uploadedAt: Date;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
}

// Mongoose schema for Image
const ImageSchema = new Schema<IImage>({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  uploadedBy: {
    type: String,
    trim: true,
    maxlength: [100, 'UploadedBy field cannot exceed 100 characters']
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  fileSize: {
    type: Number,
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    trim: true,
    enum: {
      values: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      message: 'Invalid MIME type. Supported types: jpeg, png, gif, webp, svg'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ImageSchema.index({ uploadedAt: -1 });
ImageSchema.index({ uploadedBy: 1 });
ImageSchema.index({ tags: 1 });
ImageSchema.index({ filename: 'text', description: 'text' });

// Virtual for file URL validation
ImageSchema.virtual('isValidImage').get(function() {
  return this.mimeType && this.mimeType.startsWith('image/');
});

// Instance method to get formatted upload date
ImageSchema.methods.getFormattedUploadDate = function() {
  return this.uploadedAt.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Static method to find images by uploader
ImageSchema.statics.findByUploader = function(uploader: string) {
  return this.find({ uploadedBy: uploader }).sort({ uploadedAt: -1 });
};

// Pre-save middleware
ImageSchema.pre('save', function(next) {
  if (this.filename) {
    this.filename = this.filename.trim();
  }
  
  if (!this.description && this.filename) {
    this.description = `Image: ${this.filename}`;
  }
  
  next();
});

// Prevent multiple compilations in development
const Image = mongoose.models.Image || mongoose.model<IImage>('Image', ImageSchema);

export default Image;
