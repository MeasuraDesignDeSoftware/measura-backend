import { registerAs } from '@nestjs/config';
import {
  PORT,
  NODE_ENV,
  MONGODB_URI,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM,
  FRONTEND_URL,
  SWAGGER_TITLE,
  SWAGGER_DESCRIPTION,
  SWAGGER_VERSION,
  SWAGGER_PATH,
} from '@shared/utils/constants';

export default registerAs('app', () => ({
  port: parseInt(PORT, 10),
  nodeEnv: NODE_ENV,
  mongodb: {
    uri: MONGODB_URI,
  },
  jwt: {
    secret: JWT_SECRET,
    refreshSecret: JWT_REFRESH_SECRET,
    expiresIn: JWT_EXPIRES_IN,
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
  },
  firebase: {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY,
  },
  email: {
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT, 10),
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
    from: EMAIL_FROM,
    frontendUrl: FRONTEND_URL,
  },
  swagger: {
    title: SWAGGER_TITLE,
    description: SWAGGER_DESCRIPTION,
    version: SWAGGER_VERSION,
    path: SWAGGER_PATH,
  },
}));
