import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Image from '@/models/Image';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing MongoDB connection...');
    
    // Connect to database
    await connectDB();
    
    // Test basic database operations
    const stats = {
      timestamp: new Date().toISOString(),
      database: 'Connected successfully',
      collections: {},
      testOperations: {}
    };

    // Get collection stats
    try {
      const imageCount = await Image.countDocuments();
      stats.collections = {
        images: {
          count: imageCount,
          status: 'accessible'
        }
      };
    } catch (error) {
      stats.collections = {
        images: {
          error: 'Collection not accessible',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }

    // Test write operation (create a test document)
    try {
      const testImage = new Image({
        filename: `test-${Date.now()}.jpg`,
        url: `https://example.com/test-${Date.now()}.jpg`,
        description: 'Test image for database connection',
        uploadedBy: 'system-test',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        tags: ['test', 'connection-check']
      });

      const savedImage = await testImage.save();
      stats.testOperations.create = {
        status: 'success',
        documentId: savedImage._id,
        message: 'Test document created successfully'
      };

      // Test read operation
      const foundImage = await Image.findById(savedImage._id);
      stats.testOperations.read = {
        status: 'success',
        found: !!foundImage,
        message: 'Test document retrieved successfully'
      };

      // Test update operation
      const updatedImage = await Image.findByIdAndUpdate(
        savedImage._id,
        { description: 'Updated test description' },
        { new: true }
      );
      stats.testOperations.update = {
        status: 'success',
        updated: updatedImage?.description === 'Updated test description',
        message: 'Test document updated successfully'
      };

      // Test delete operation (cleanup)
      await Image.findByIdAndDelete(savedImage._id);
      stats.testOperations.delete = {
        status: 'success',
        message: 'Test document deleted successfully'
      };

    } catch (operationError) {
      stats.testOperations.error = {
        status: 'failed',
        message: operationError instanceof Error ? operationError.message : 'Unknown operation error'
      };
    }

    // Additional database information
    const additionalInfo = {
      environment: process.env.NODE_ENV || 'unknown',
      mongoUri: process.env.MONGO_URI ? 'Set (hidden for security)' : 'Not set',
      nodeVersion: process.version,
      platform: process.platform
    };

    console.log('✅ Database test completed successfully');

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection test successful',
      stats,
      info: additionalInfo
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'MongoDB connection test failed',
      error: {
        name: error instanceof Error ? error.name : 'Unknown Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      troubleshooting: {
        checkPoints: [
          'Verify MONGO_URI is set in .env file',
          'Check MongoDB Atlas network access (IP whitelist)',
          'Verify database user permissions',
          'Check if MongoDB cluster is running',
          'Validate connection string format'
        ],
        mongoUri: process.env.MONGO_URI ? 'Environment variable is set' : 'Environment variable is missing'
      }
    }, { status: 500 });
  }
}

// Optional: Add POST method for creating test images
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const newImage = new Image({
      filename: body.filename || `api-test-${Date.now()}.jpg`,
      url: body.url || `https://example.com/api-test-${Date.now()}.jpg`,
      description: body.description || 'Image created via API test',
      uploadedBy: body.uploadedBy || 'api-test',
      mimeType: body.mimeType || 'image/jpeg',
      fileSize: body.fileSize || 2048,
      tags: body.tags || ['api', 'test']
    });

    const savedImage = await newImage.save();
    
    return NextResponse.json({
      success: true,
      message: 'Test image created successfully',
      image: savedImage
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to create test image',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
