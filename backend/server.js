require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const db = require('./models');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const constants = require('./utils/constants');

// Initialize queue workers
if (process.env.REDIS_HOST) {
  require('./workers/encodingWorker');
  require('./workers/cleanupWorker');
}

// Import routes
const authRoutes = require('./routes/auth');
const audioRoutes = require('./routes/audio');
const planRoutes = require('./routes/plans');
const subscriptionRoutes = require('./routes/subscriptions');
const affiliateRoutes = require('./routes/affiliate');
const analyticsRoutes = require('./routes/analytics');
const shareRoutes = require('./routes/share');
const folderRoutes = require('./routes/folders');
const publicFolderRoutes = require('./routes/publicFolder');
const encodingRoutes = require('./routes/encoding');
const bulkRoutes = require('./routes/bulk');
const searchRoutes = require('./routes/search');
const emailRoutes = require('./routes/email');
const adminRoutes = require('./routes/admin');
const apiKeyRoutes = require('./routes/apiKeys');
const playlistRoutes = require('./routes/playlists');
const interactionRoutes = require('./routes/interactions');
const trashRoutes = require('./routes/trash');
const webhookRoutes = require('./routes/webhooks');
const remoteUploadRoutes = require('./routes/remoteUpload');
const paymentRoutes = require('./routes/payments');
const analyticsExportRoutes = require('./routes/analyticsExport');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: Object.values(constants.HTTP_METHODS),
  allowedHeaders: [constants.HTTP_HEADERS.CONTENT_TYPE, constants.HTTP_HEADERS.AUTHORIZATION]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: constants.RATE_LIMIT.WINDOW_MS,
  max: constants.RATE_LIMIT.MAX_REQUESTS
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: constants.FILE_UPLOAD.MAX_SIZE_MB }));
app.use(express.urlencoded({ extended: true, limit: constants.FILE_UPLOAD.MAX_SIZE_MB }));
app.use(cookieParser());

// Stripe webhook needs raw body
app.use('/api/payments/stripe-webhook', express.raw({ type: constants.CONTENT_TYPES.JSON }));

// Logging
if (config.nodeEnv === constants.ENV.DEVELOPMENT) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    [constants.RESPONSE_KEYS.SUCCESS]: true,
    [constants.RESPONSE_KEYS.MESSAGE]: constants.APP_DESCRIPTION,
    [constants.RESPONSE_KEYS.VERSION]: constants.APP_VERSION,
    [constants.RESPONSE_KEYS.ENDPOINTS]: {
      auth: constants.API_ENDPOINTS.AUTH,
      audio: constants.API_ENDPOINTS.AUDIO,
      plans: constants.API_ENDPOINTS.PLANS,
      subscriptions: constants.API_ENDPOINTS.SUBSCRIPTIONS,
      affiliate: constants.API_ENDPOINTS.AFFILIATE,
      analytics: constants.API_ENDPOINTS.ANALYTICS
    },
    [constants.RESPONSE_KEYS.HEALTH]: constants.API_ENDPOINTS.HEALTH,
    [constants.RESPONSE_KEYS.TIMESTAMP]: new Date().toISOString()
  });
});

// Health check
app.get(constants.API_ENDPOINTS.HEALTH, (req, res) => {
  res.json({
    [constants.RESPONSE_KEYS.SUCCESS]: true,
    [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.SERVER_RUNNING,
    [constants.RESPONSE_KEYS.TIMESTAMP]: new Date().toISOString()
  });
});

// Public share routes (must be before API routes for proper matching)
app.use('/', shareRoutes);
app.use(constants.PUBLIC_ROUTES.FOLDER_SHARE, publicFolderRoutes);

// API routes
app.use(constants.API_ENDPOINTS.AUTH, authRoutes);
app.use(constants.API_ENDPOINTS.EMAIL, emailRoutes);
app.use(constants.API_ENDPOINTS.AUDIO, audioRoutes);
app.use(constants.API_ENDPOINTS.BULK, bulkRoutes);
app.use(constants.API_ENDPOINTS.SEARCH, searchRoutes);
app.use(constants.API_ENDPOINTS.PLANS, planRoutes);
app.use(constants.API_ENDPOINTS.SUBSCRIPTIONS, subscriptionRoutes);
app.use(constants.API_ENDPOINTS.AFFILIATE, affiliateRoutes);
app.use(constants.API_ENDPOINTS.ANALYTICS, analyticsRoutes);
app.use(constants.API_ENDPOINTS.FOLDERS, folderRoutes);
app.use(constants.API_ENDPOINTS.ENCODING, encodingRoutes);
app.use(constants.API_ENDPOINTS.ADMIN, adminRoutes);
app.use(constants.API_ENDPOINTS.API_KEYS, apiKeyRoutes);
app.use(constants.API_ENDPOINTS.PLAYLISTS, playlistRoutes);
app.use(constants.API_ENDPOINTS.INTERACTIONS, interactionRoutes);
app.use(constants.API_ENDPOINTS.TRASH, trashRoutes);
app.use(constants.API_ENDPOINTS.WEBHOOKS, webhookRoutes);
app.use(constants.API_ENDPOINTS.REMOTE_UPLOAD, remoteUploadRoutes);
app.use(constants.API_ENDPOINTS.PAYMENTS, paymentRoutes);
app.use(constants.API_ENDPOINTS.ANALYTICS, analyticsExportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(constants.HTTP_STATUS.NOT_FOUND).json({
    [constants.RESPONSE_KEYS.SUCCESS]: false,
    [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.ROUTE_NOT_FOUND
  });
});

// Error handler
app.use(errorHandler);

// Database connection and server start
const PORT = config.port;

db.sequelize.authenticate()
  .then(() => {
    console.log(constants.MESSAGES.DB_CONNECTION_ESTABLISHED);
    
    // Don't use sync with alter - use migrations instead
    // Sync only creates tables if they don't exist (force: false)
    // Use migrations for schema changes: npm run db:migrate
    return db.sequelize.sync({ alter: false }).then(async () => {
      // Add allowedDomains column if it doesn't exist
      try {
        const queryInterface = db.sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable('api_keys');
        
        if (!tableDescription.allowedDomains) {
          console.log('Adding allowedDomains column to api_keys table...');
          await queryInterface.addColumn('api_keys', 'allowedDomains', {
            type: db.sequelize.Sequelize.JSON,
            allowNull: true,
            defaultValue: [],
            comment: 'Array of allowed domains for API key usage'
          });
          console.log('allowedDomains column added successfully.');
        }
      } catch (error) {
        // Column might already exist or table might not exist yet
        if (error.message && !error.message.includes('Duplicate column name')) {
          console.error('Error checking/adding allowedDomains column:', error.message);
        }
      }
    });
  })
  .then(() => {
    console.log(constants.MESSAGES.DB_CONNECTION_READY);
    console.log('Note: Run migrations for schema changes: npm run db:migrate');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  })
  .catch((err) => {
    console.error(constants.MESSAGES.DB_CONNECTION_ERROR, err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await db.sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await db.sequelize.close();
  process.exit(0);
});

module.exports = app;

