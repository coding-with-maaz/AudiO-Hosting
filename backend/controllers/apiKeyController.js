const db = require('../models');
const crypto = require('crypto');

// Generate API key
const generateApiKey = () => {
  return `ak_${crypto.randomBytes(24).toString('hex')}`;
};

// Generate API secret
const generateApiSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.createApiKey = async (req, res, next) => {
  try {
    const { name, rateLimit, permissions, allowedDomains } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required'
      });
    }

    // Generate key and secret
    const key = generateApiKey();
    const secret = generateApiSecret();

    // Validate and format allowed domains
    let domains = [];
    if (allowedDomains && Array.isArray(allowedDomains)) {
      domains = allowedDomains
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
    }

    const apiKey = await db.ApiKey.create({
      userId: req.user.id,
      name,
      key,
      secret,
      rateLimit: rateLimit || 1000,
      permissions: permissions || {},
      allowedDomains: domains
    });

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key,
          secret: apiKey.secret, // Only shown once
          rateLimit: apiKey.rateLimit,
          permissions: apiKey.permissions,
          allowedDomains: apiKey.allowedDomains || [],
          createdAt: apiKey.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getApiKeys = async (req, res, next) => {
  try {
    const apiKeys = await db.ApiKey.findAll({
      where: { userId: req.user.id },
      attributes: { exclude: ['secret'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { apiKeys }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateApiKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, rateLimit, isActive, permissions, allowedDomains } = req.body;

    const apiKey = await db.ApiKey.findOne({
      where: { id, userId: req.user.id }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (rateLimit !== undefined) updates.rateLimit = parseInt(rateLimit);
    if (isActive !== undefined) updates.isActive = isActive;
    if (permissions !== undefined) updates.permissions = permissions;
    if (allowedDomains !== undefined) {
      // Validate and format allowed domains
      if (Array.isArray(allowedDomains)) {
        updates.allowedDomains = allowedDomains
          .map(domain => domain.trim())
          .filter(domain => domain.length > 0);
      } else {
        updates.allowedDomains = [];
      }
    }

    await apiKey.update(updates);

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: { apiKey }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteApiKey = async (req, res, next) => {
  try {
    const { id } = req.params;

    const apiKey = await db.ApiKey.findOne({
      where: { id, userId: req.user.id }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    await apiKey.destroy();

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

