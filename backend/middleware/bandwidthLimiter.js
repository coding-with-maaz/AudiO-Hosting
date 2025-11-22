const db = require('../models');
const { trackBandwidth } = require('../utils/bandwidthTracker');

/**
 * Middleware to check and track bandwidth usage
 */
const bandwidthLimiter = async (req, res, next) => {
  try {
    // Skip for non-authenticated requests or admin
    if (!req.user || req.user.role === 'admin') {
      return next();
    }

    const user = await db.User.findByPk(req.user.id);
    
    // Check if user has bandwidth limit
    if (user.bandwidthLimit) {
      // Reset bandwidth if reset date passed
      if (user.bandwidthResetDate && new Date() > user.bandwidthResetDate) {
        await user.update({
          bandwidthUsed: 0,
          bandwidthResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }

      // Check if limit exceeded
      if (user.bandwidthUsed >= user.bandwidthLimit) {
        return res.status(429).json({
          success: false,
          message: 'Bandwidth limit exceeded',
          used: user.bandwidthUsed,
          limit: user.bandwidthLimit,
          resetDate: user.bandwidthResetDate
        });
      }
    }

    // Attach bandwidth info to request
    req.bandwidthInfo = {
      used: user.bandwidthUsed,
      limit: user.bandwidthLimit,
      resetDate: user.bandwidthResetDate
    };

    next();
  } catch (error) {
    console.error('Bandwidth limiter error:', error);
    next(); // Continue on error
  }
};

/**
 * Track bandwidth after response
 */
const trackBandwidthAfterResponse = async (req, res, audioId = null) => {
  try {
    if (!req.user || req.user.role === 'admin') {
      return;
    }

    const contentLength = parseInt(res.get('content-length') || 0);
    if (contentLength > 0) {
      const type = req.path.includes('/download') ? 'download' : 'stream';
      await trackBandwidth(
        req.user.id,
        contentLength,
        type,
        audioId,
        req.ip
      );
    }
  } catch (error) {
    console.error('Bandwidth tracking error:', error);
  }
};

module.exports = {
  bandwidthLimiter,
  trackBandwidthAfterResponse
};

