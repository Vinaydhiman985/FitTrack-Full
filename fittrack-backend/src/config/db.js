import mongoose from 'mongoose';
import config from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[db] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[db] MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ Server is running without a database connection. Database operations will fail.');
  }
};

export default connectDB;
