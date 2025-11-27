const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../models');
const apiKeyAuth = require('./apiKeyAuth');
const constants = require('../constants');

const authenticate = async (req, res, next) => {
  try {
    // Check if API key is provided
    const apiKey = req.headers[constants.HTTP_HEADERS.X_API_KEY] || req.query[constants.QUERY_PARAMS.API_KEY];
    
    if (apiKey) {
      // Use API key authentication
      return apiKeyAuth(req, res, next);
    }

    // Otherwise, use JWT authentication
    const authHeader = req.headers[constants.HTTP_HEADERS.AUTHORIZATION];
    const token = authHeader?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.AUTH_REQUIRED
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await db.User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.INVALID_USER
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === constants.JWT_ERRORS.JSON_WEB_TOKEN_ERROR) {
      return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.INVALID_TOKEN
      });
    }
    if (error.name === constants.JWT_ERRORS.TOKEN_EXPIRED_ERROR) {
      return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.TOKEN_EXPIRED
      });
    }
    return res.status(constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      [constants.RESPONSE_KEYS.SUCCESS]: false,
      [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.AUTH_REQUIRED,
      [constants.RESPONSE_KEYS.ERROR]: error.message
    });
  }
};

// Optional authentication - sets req.user if token exists, but doesn't fail if not
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers[constants.HTTP_HEADERS.AUTHORIZATION];
    const token = authHeader?.split(' ')[1] || req.cookies?.token;

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
      return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.AUTH_REQUIRED
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.INSUFFICIENT_PERMISSIONS
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

