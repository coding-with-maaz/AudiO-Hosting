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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Stripe webhook needs raw body
app.use('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Audio Hosting Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      audio: '/api/audio',
      plans: '/api/plans',
      subscriptions: '/api/subscriptions',
      affiliate: '/api/affiliate',
      analytics: '/api/analytics'
    },
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Public share routes (must be before API routes for proper matching)
app.use('/', shareRoutes);
app.use('/f', publicFolderRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/encoding', encodingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/remote-upload', remoteUploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsExportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Database connection and server start
const PORT = config.port;

db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    
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
    console.log('Database connection ready.');
    console.log('Note: Run migrations for schema changes: npm run db:migrate');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
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

