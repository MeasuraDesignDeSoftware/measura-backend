import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/measura',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'default-refresh-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  swagger: {
    title: process.env.SWAGGER_TITLE || 'Measura API',
    description:
      process.env.SWAGGER_DESCRIPTION ||
      'API for Measura - Software Measurement Tool',
    version: process.env.SWAGGER_VERSION || '1.0',
    path: process.env.SWAGGER_PATH || 'api',
  },
}));
