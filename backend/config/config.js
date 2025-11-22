require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads/audio',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
    allowedTypes: process.env.ALLOWED_AUDIO_TYPES?.split(',') || [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac'
    ]
  },
  affiliate: {
    commissionRate: parseFloat(process.env.AFFILIATE_COMMISSION_RATE) || 0.15,
    minPayout: parseFloat(process.env.AFFILIATE_MIN_PAYOUT) || 50
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};

