require('dotenv').config();
const constants = require('../constants');

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || constants.ENV.DEVELOPMENT,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expire: process.env.JWT_EXPIRE || constants.JWT.DEFAULT_EXPIRE
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads/audio',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || constants.FILE_UPLOAD.MAX_SIZE,
    allowedTypes: process.env.ALLOWED_AUDIO_TYPES?.split(',') || constants.FILE_UPLOAD.ALLOWED_AUDIO_TYPES
  },
  affiliate: {
    commissionRate: parseFloat(process.env.AFFILIATE_COMMISSION_RATE) || 0.15,
    minPayout: parseFloat(process.env.AFFILIATE_MIN_PAYOUT) || 50
  },
  cors: {
    origin: process.env.CORS_ORIGIN || constants.URLS.DEFAULT_BACKEND
  }
};

