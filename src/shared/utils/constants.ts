// Environment Variables - Individual Constants
// Server Configuration
export const PORT = process.env.PORT || '8080';
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Database Configuration
export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/measura';

// JWT Configuration
export const JWT_SECRET =
  process.env.JWT_SECRET || 'default-secret-key-change-in-production';
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'default-refresh-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Firebase Configuration
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

// Email Configuration
export const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
export const EMAIL_PORT = process.env.EMAIL_PORT || '587';
export const EMAIL_USER = process.env.EMAIL_USER || '';
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Measura <no-reply@measura.com>';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Swagger Configuration
export const SWAGGER_TITLE = process.env.SWAGGER_TITLE || 'Measura API';
export const SWAGGER_DESCRIPTION =
  process.env.SWAGGER_DESCRIPTION ||
  'API for Measura - Software Measurement Tool';
export const SWAGGER_VERSION = process.env.SWAGGER_VERSION || '1.0';
export const SWAGGER_PATH = process.env.SWAGGER_PATH || 'api';

// File Upload Configuration
export const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/documents';
export const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '10485760'; // 10MB default

export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,

  // Password constraints
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,

  // File upload constraints
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],

  // Date formats
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    DAILY: 86400, // 24 hours
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const;

export const ERROR_CODES = {
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',

  // Business logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  INVALID_ENTITY_STATE: 'INVALID_ENTITY_STATE',

  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
} as const;

export const HTTP_STATUS_MESSAGES = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
} as const;
