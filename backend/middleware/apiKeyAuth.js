const db = require('../models');

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const apiSecret = req.headers['x-api-secret'] || req.query.api_secret;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    const key = await db.ApiKey.findOne({
      where: {
        key: apiKey,
        isActive: true
      },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'role', 'isActive']
      }]
    });

    if (!key) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check secret if provided
    if (apiSecret && key.secret !== apiSecret) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API secret'
      });
    }

    // Check if user is active
    if (!key.user || !key.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Update last used
    await key.update({ lastUsed: new Date() });

    // Set user from API key
    req.user = key.user;
    req.apiKey = key;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'API authentication error',
      error: error.message
    });
  }
};

module.exports = apiKeyAuth;

