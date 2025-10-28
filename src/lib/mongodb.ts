import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/polidaoDB';

// Image schema for Mongoose
const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  data: { type: Buffer, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const ImageModel = mongoose.models.Image || mongoose.model('Image', imageSchema);

// Campaign Image schema for linking images to campaigns
const campaignImageSchema = new mongoose.Schema({
  campaignId: { type: String, required: true, index: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true },
  isPrimary: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, required: true }, // wallet address
});

const CampaignImageModel = mongoose.models.CampaignImage || mongoose.model('CampaignImage', campaignImageSchema);

// Connect to MongoDB using Mongoose - SIMPLE VERSION
export async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
      console.log('Connected to MongoDB via Mongoose');
    }
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Upload image using Mongoose
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  metadata: any
): Promise<string> {
  try {
    await connectToDatabase();

    const image = new ImageModel({
      filename,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      data: buffer,
    });

    const savedImage = await image.save();
    console.log(`File ${filename} uploaded successfully with ID: ${savedImage._id}`);

    return savedImage._id.toString();
  } catch (error) {
    console.error('Mongoose upload error:', error);
    throw error;
  }
}

// Link image to campaign
export async function linkImageToCampaign(
  imageId: string,
  campaignId: string,
  uploadedBy: string,
  isPrimary: boolean = false
): Promise<string> {
  try {
    await connectToDatabase();

    // If this is primary image, unset other primary images for this campaign
    if (isPrimary) {
      await CampaignImageModel.updateMany(
        { campaignId },
        { isPrimary: false }
      );
    }

    const campaignImage = new CampaignImageModel({
      campaignId,
      imageId,
      uploadedBy,
      isPrimary,
    });

    const saved = await campaignImage.save();
    console.log(`Image ${imageId} linked to campaign ${campaignId}`);
    
    return saved._id.toString();
  } catch (error) {
    console.error('Error linking image to campaign:', error);
    throw error;
  }
}

// Get images for campaign
export async function getCampaignImages(campaignId: string) {
  try {
    await connectToDatabase();

    const campaignImages = await CampaignImageModel
      .find({ campaignId })
      .populate('imageId')
      .sort({ isPrimary: -1, uploadedAt: -1 });

    return campaignImages.map(ci => ({
      linkId: ci._id.toString(),
      campaignId: ci.campaignId,
      imageId: ci.imageId.toString(),
      isPrimary: ci.isPrimary,
      uploadedAt: ci.uploadedAt,
      uploadedBy: ci.uploadedBy,
      image: ci.imageId,
    }));
  } catch (error) {
    console.error('Error getting campaign images:', error);
    throw error;
  }
}

// Get image by ID
export async function getImageById(imageId: string) {
  try {
    await connectToDatabase();
    const image = await ImageModel.findById(imageId);
    return image;
  } catch (error) {
    console.error('Error getting image:', error);
    throw error;
  }
}

// Get image URL for serving (updated)
export function getImageUrl(imageId: string | null | undefined): string | null {
  if (!imageId) return null;
  return `/api/images/${imageId}`;
}

// Get safe image props for Next.js Image component
export function getImageProps(imageId: string | null | undefined) {
  const url = getImageUrl(imageId);
  if (!url) return null;
  
  return {
    src: url,
    unoptimized: true, // Disable Next.js optimization for our custom endpoint
  };
}

// Test MongoDB connection - SIMPLE VERSION
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    
    // Test basic database operations
    const testData = new ImageModel({
      filename: 'test_connection.txt',
      originalName: 'test_connection.txt',
      mimeType: 'text/plain',
      size: 100,
      data: Buffer.from('test connection data'),
    });
    
    const saved = await testData.save();
    await ImageModel.findByIdAndDelete(saved._id); // Clean up test data
    
    return { 
      success: true, 
      message: `MongoDB connected successfully. Database: ${mongoose.connection.name}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Get connection status - SIMPLE VERSION
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState as keyof typeof states] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
}

export default mongoose;