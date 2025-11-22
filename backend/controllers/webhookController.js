const db = require('../models');
const crypto = require('crypto');

exports.createWebhook = async (req, res, next) => {
  try {
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        message: 'URL and events array are required'
      });
    }

    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    // Store webhook in user metadata or create separate table
    const user = await db.User.findByPk(req.user.id);
    const webhooks = user.metadata?.webhooks || [];
    
    const webhook = {
      id: crypto.randomUUID(),
      url,
      events,
      secret: webhookSecret,
      isActive: true,
      createdAt: new Date()
    };

    webhooks.push(webhook);

    await user.update({
      metadata: {
        ...user.metadata,
        webhooks
      }
    });

    res.status(201).json({
      success: true,
      message: 'Webhook created',
      data: { webhook }
    });
  } catch (error) {
    next(error);
  }
};

exports.getWebhooks = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    const webhooks = user.metadata?.webhooks || [];

    // Don't expose secrets
    const safeWebhooks = webhooks.map(w => ({
      ...w,
      secret: undefined
    }));

    res.json({
      success: true,
      data: { webhooks: safeWebhooks }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await db.User.findByPk(req.user.id);
    const webhooks = user.metadata?.webhooks || [];

    const filtered = webhooks.filter(w => w.id !== id);

    await user.update({
      metadata: {
        ...user.metadata,
        webhooks: filtered
      }
    });

    res.json({
      success: true,
      message: 'Webhook deleted'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to trigger webhooks
async function triggerWebhook(userId, event, data) {
  try {
    const user = await db.User.findByPk(userId);
    const webhooks = user.metadata?.webhooks || [];

    const relevantWebhooks = webhooks.filter(
      w => w.isActive && w.events.includes(event)
    );

    for (const webhook of relevantWebhooks) {
      const axios = require('axios');
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(data))
        .digest('hex');

      try {
        await axios.post(webhook.url, {
          event,
          data,
          timestamp: new Date().toISOString()
        }, {
          headers: {
            'X-Webhook-Signature': signature,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
      } catch (error) {
        console.error(`Webhook failed for ${webhook.url}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}

module.exports.triggerWebhook = triggerWebhook;

