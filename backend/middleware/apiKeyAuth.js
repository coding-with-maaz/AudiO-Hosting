const db = require('../models');

// Extract domain from origin/referer
const extractDomain = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
};

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

    // Check allowed domains if configured
    if (key.allowedDomains && Array.isArray(key.allowedDomains) && key.allowedDomains.length > 0) {
      const origin = req.headers.origin || req.headers.referer;
      const requestDomain = extractDomain(origin);
      
      if (!requestDomain) {
        return res.status(403).json({
          success: false,
          message: 'Domain origin required for API key usage'
        });
      }

      // Check if domain is allowed (exact match or wildcard subdomain)
      const isAllowed = key.allowedDomains.some(allowedDomain => {
        if (allowedDomain === '*') return true; // Allow all domains
        if (allowedDomain === requestDomain) return true; // Exact match
        if (allowedDomain.startsWith('*.') && requestDomain.endsWith(allowedDomain.slice(1))) return true; // Wildcard subdomain
        return false;
      });

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Domain '${requestDomain}' is not allowed for this API key`,
          allowedDomains: key.allowedDomains
        });
      }
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

