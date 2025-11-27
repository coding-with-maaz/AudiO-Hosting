/**
 * Application Constants
 * Centralized constants for reuse across the backend
 */

// Application Info
const APP_NAME = 'AUDioHub';
const APP_VERSION = '1.0.0';
const APP_DESCRIPTION = 'AUDioHub API';

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// HTTP Methods
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS'
};

// HTTP Headers
const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  X_API_KEY: 'x-api-key'
};

// Content Types
const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART_FORM_DATA: 'multipart/form-data'
};

// Response Messages
const MESSAGES = {
  // General
  SUCCESS: 'Success',
  ERROR: 'Error',
  SERVER_ERROR: 'Server Error',
  ROUTE_NOT_FOUND: 'Route not found',
  SERVER_RUNNING: 'Server is running',
  
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_USER: 'Invalid or inactive user',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // Resources
  NOT_FOUND: 'Resource not found',
  ACCESS_DENIED: 'Access denied',
  DUPLICATE_FIELD: 'Duplicate field value entered',
  VALIDATION_ERROR: 'Validation error',
  
  // Audio
  AUDIO_NOT_FOUND: 'Audio not found',
  FILE_NOT_FOUND: 'File not found on server',
  PASSWORD_REQUIRED: 'Password required or incorrect',
  
  // Database
  DB_CONNECTION_ESTABLISHED: 'Database connection established successfully.',
  DB_CONNECTION_READY: 'Database connection ready.',
  DB_CONNECTION_ERROR: 'Unable to connect to the database:',
  
  // Email
  EMAIL_VERIFICATION_SUBJECT: 'Verify Your Email Address - OTP Code',
  PASSWORD_RESET_SUBJECT: 'Reset Your Password',
  WELCOME_SUBJECT: 'Welcome to AUDioHub!',
  
  // Share
  SHARING_ENABLED: 'Sharing enabled',
  SHARING_DISABLED: 'Sharing disabled',
  
  // Contact/Support
  CONTACT_SUBMITTED: 'Contact message submitted successfully',
  CONTACT_NOT_FOUND: 'Contact message not found',
  CONTACT_UPDATED: 'Contact message updated successfully',
  CONTACT_DELETED: 'Contact message deleted successfully',
  INVALID_CATEGORY: 'Invalid category',
  INVALID_PRIORITY: 'Invalid priority',
  INVALID_STATUS: 'Invalid status',
  RESPONSE_REQUIRED: 'Response is required',
  TICKET_ASSIGNED: 'Ticket assigned successfully',
  TICKET_RESOLVED: 'Ticket resolved successfully'
};

// API Endpoints
const API_ENDPOINTS = {
  AUTH: '/api/auth',
  AUDIO: '/api/audio',
  PLANS: '/api/plans',
  SUBSCRIPTIONS: '/api/subscriptions',
  AFFILIATE: '/api/affiliate',
  ANALYTICS: '/api/analytics',
  FOLDERS: '/api/folders',
  ENCODING: '/api/encoding',
  ADMIN: '/api/admin',
  API_KEYS: '/api/api-keys',
  PLAYLISTS: '/api/playlists',
  INTERACTIONS: '/api/interactions',
  TRASH: '/api/trash',
  WEBHOOKS: '/api/webhooks',
  REMOTE_UPLOAD: '/api/remote-upload',
  PAYMENTS: '/api/payments',
  BULK: '/api/bulk',
  SEARCH: '/api/search',
  EMAIL: '/api/email',
  SHARE: '/api/share',
  CONTACT: '/api/contact',
  SUPPORT: '/api/support',
  HEALTH: '/health'
};

// Public Routes
const PUBLIC_ROUTES = {
  DIRECT_DOWNLOAD: '/d',
  EMBED: '/e',
  FOLDER_SHARE: '/f'
};

// Time Constants (in milliseconds)
const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  
  // Specific durations
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  PASSWORD_RESET_EXPIRY: 60 * 60 * 1000, // 1 hour
  REMOTE_UPLOAD_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  DB_CONNECTION_ACQUIRE: 30000 // 30 seconds
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: TIME.RATE_LIMIT_WINDOW,
  MAX_REQUESTS: 100,
  MESSAGE: 'Too many requests, please try again later'
};

// File Upload
const FILE_UPLOAD = {
  MAX_SIZE: 104857600, // 100MB in bytes
  MAX_SIZE_MB: '10mb',
  ALLOWED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac'
  ]
};

// Database
const DATABASE = {
  DEFAULT_NAME: 'audio_hosting_db',
  POOL: {
    MAX: 5,
    MIN: 0,
    IDLE: 10000,
    ACQUIRE: TIME.DB_CONNECTION_ACQUIRE,
    EVICT: 1000
  }
};

// URLs
const URLS = {
  DEFAULT_BACKEND: 'http://localhost:3000',
  DEFAULT_FRONTEND: 'http://localhost:3001',
  DEFAULT_BASE: process.env.BASE_URL || 'http://localhost:3000',
  DEFAULT_FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001'
};

// JWT
const JWT = {
  DEFAULT_EXPIRE: '7d',
  BEARER_PREFIX: 'Bearer '
};

// Email
const EMAIL = {
  OTP_EXPIRY_MINUTES: 10,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  DEFAULT_FROM: 'noreply@audiohub.com',
  SUBJECTS: {
    VERIFICATION: 'Verify Your Email Address - OTP Code',
    PASSWORD_RESET: 'Reset Your Password',
    WELCOME: 'Welcome to AUDioHub!'
  }
};

// Embed Code Templates
const EMBED_TEMPLATES = {
  STANDARD: (url) => `<iframe src="${url}" width="100%" height="400" frameborder="0" allow="autoplay" style="border-radius: 12px;"></iframe>`,
  TRANSPARENT: (url) => `<iframe src="${url}" width="100%" height="400" frameborder="0" allow="autoplay" style="background: transparent; border: none;"></iframe>`,
  MINIMAL: (url) => `<iframe src="${url}" width="100%" height="120" frameborder="0" allow="autoplay" style="border-radius: 8px;"></iframe>`,
  COMPACT_TRANSPARENT: (url) => `<iframe src="${url}" width="100%" height="120" frameborder="0" allow="autoplay" style="background: transparent; border: none;"></iframe>`,
  AUTOPLAY: (url) => `<iframe src="${url}" width="100%" height="400" frameborder="0" allow="autoplay" style="border-radius: 12px;"></iframe>`,
  AUTOPLAY_TRANSPARENT: (url) => `<iframe src="${url}" width="100%" height="400" frameborder="0" allow="autoplay" style="background: transparent; border: none;"></iframe>`
};

// Embed Heights
const EMBED_HEIGHTS = {
  FULL: '400',
  COMPACT: '120',
  MINIMAL: '300'
};

// Query Parameters
const QUERY_PARAMS = {
  PASSWORD: 'password',
  EMBED: 'embed',
  TRANSPARENT: 'transparent',
  COMPACT: 'compact',
  AUTOPLAY: 'autoplay',
  HIDE_TITLE: 'hideTitle',
  HIDE_ARTIST: 'hideArtist',
  HIDE_COVER: 'hideCover',
  API_KEY: 'api_key'
};

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  AFFILIATE: 'affiliate'
};

// Sequelize Error Names
const SEQUELIZE_ERRORS = {
  VALIDATION_ERROR: 'SequelizeValidationError',
  UNIQUE_CONSTRAINT: 'SequelizeUniqueConstraintError',
  FOREIGN_KEY_CONSTRAINT: 'SequelizeForeignKeyConstraintError'
};

// JWT Error Names
const JWT_ERRORS = {
  JSON_WEB_TOKEN_ERROR: 'JsonWebTokenError',
  TOKEN_EXPIRED_ERROR: 'TokenExpiredError'
};

// Response Keys
const RESPONSE_KEYS = {
  SUCCESS: 'success',
  MESSAGE: 'message',
  DATA: 'data',
  ERROR: 'error',
  STACK: 'stack',
  VERSION: 'version',
  TIMESTAMP: 'timestamp',
  HEALTH: 'health',
  ENDPOINTS: 'endpoints'
};

// Boolean String Values
const BOOLEAN_STRINGS = {
  TRUE: 'true',
  FALSE: 'false'
};

// Environment
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

module.exports = {
  // Application
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  
  // HTTP
  HTTP_STATUS,
  HTTP_METHODS,
  HTTP_HEADERS,
  CONTENT_TYPES,
  
  // Messages
  MESSAGES,
  
  // Endpoints
  API_ENDPOINTS,
  PUBLIC_ROUTES,
  
  // Time
  TIME,
  
  // Rate Limiting
  RATE_LIMIT,
  
  // File Upload
  FILE_UPLOAD,
  
  // Database
  DATABASE,
  
  // URLs
  URLS,
  
  // JWT
  JWT,
  
  // Email
  EMAIL,
  
  // Embed
  EMBED_TEMPLATES,
  EMBED_HEIGHTS,
  
  // Query Parameters
  QUERY_PARAMS,
  
  // User Roles
  USER_ROLES,
  
  // Errors
  SEQUELIZE_ERRORS,
  JWT_ERRORS,
  
  // Response
  RESPONSE_KEYS,
  
  // Boolean
  BOOLEAN_STRINGS,
  
  // Environment
  ENV
};

