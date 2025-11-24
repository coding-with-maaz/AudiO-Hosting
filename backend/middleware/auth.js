const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../models');
const apiKeyAuth = require('./apiKeyAuth');

const authenticate = async (req, res, next) => {
  try {
    // Check if API key is provided
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (apiKey) {
      // Use API key authentication
      return apiKeyAuth(req, res, next);
    }

    // Otherwise, use JWT authentication
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await db.User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Optional authentication - sets req.user if token exists, but doesn't fail if not
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await db.User.findByPk(decoded.userId);

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid or expired, but continue without user
        // This allows public access while still checking ownership if token is valid
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize
};

