import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fittrack',
  jwtSecret: process.env.JWT_SECRET || 'fittrack_default_secret',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  assetBaseUrl: process.env.ASSET_BASE_URL || '',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
};

export default config;
