import mongoose from 'mongoose';

// TypeScript interface for global mongoose cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global type to include mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error(
    'Please define the MONGO_URI environment variable inside .env file'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    console.log('🔄 Connecting to MongoDB...');
    
    cached.promise = mongoose.connect(MONGO_URI!, opts).then((mongoose) => {
      console.log('✅ Successfully connected to MongoDB Atlas');
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
      console.log(`🌐 Host: ${mongoose.connection.host}`);
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔴 MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
