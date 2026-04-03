import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/fittrack';

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_URI;
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
