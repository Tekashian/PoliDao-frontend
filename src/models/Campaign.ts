import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  campaignId: string;
  title: string;
  description: string;
  imageUrl?: string;
  location?: string;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  campaignId: {
    type: String,
    required: [true, 'Campaign ID is required'],
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\/api\/image\/[a-fA-F0-9]{24}$/.test(v);
      },
      message: 'Invalid image URL format'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  creator: {
    type: String,
    required: [true, 'Creator address is required'],
    lowercase: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Index for faster queries
CampaignSchema.index({ creator: 1, createdAt: -1 });

const Campaign = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
