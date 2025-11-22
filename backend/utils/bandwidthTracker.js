const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Track bandwidth usage for a user
 */
async function trackBandwidth(userId, bytes, type = 'download', audioId = null, ipAddress = null) {
  try {
    const now = moment();
    const month = now.month() + 1; // 1-12
    const year = now.year();

    // Find or create bandwidth record for this month
    const [bandwidth, created] = await db.Bandwidth.findOrCreate({
      where: {
        userId,
        year,
        month,
        type
      },
      defaults: {
        userId,
        audioId,
        bytesUsed: bytes,
        year,
        month,
        type,
        ipAddress
      }
    });

    if (!created) {
      // Update existing record
      await bandwidth.increment('bytesUsed', { by: bytes });
      if (audioId) bandwidth.audioId = audioId;
      if (ipAddress) bandwidth.ipAddress = ipAddress;
      await bandwidth.save();
    }

    // Update user's current bandwidth usage
    const user = await db.User.findByPk(userId);
    if (user) {
      await user.increment('bandwidthUsed', { by: bytes });
      
      // Check if bandwidth limit exceeded
      if (user.bandwidthLimit && user.bandwidthUsed > user.bandwidthLimit) {
        return {
          success: false,
          exceeded: true,
          used: user.bandwidthUsed,
          limit: user.bandwidthLimit
        };
      }
    }

    return {
      success: true,
      used: user?.bandwidthUsed || 0,
      limit: user?.bandwidthLimit || null
    };
  } catch (error) {
    console.error('Bandwidth tracking error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset monthly bandwidth for all users
 */
async function resetMonthlyBandwidth() {
  try {
    const now = moment();
    const users = await db.User.findAll({
      where: {
        bandwidthResetDate: {
          [db.Sequelize.Op.lt]: now.toDate()
        }
      }
    });

    for (const user of users) {
      await user.update({
        bandwidthUsed: 0,
        bandwidthResetDate: moment().add(1, 'month').toDate()
      });
    }

    return { success: true, reset: users.length };
  } catch (error) {
    console.error('Bandwidth reset error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get bandwidth usage for a user
 */
async function getUserBandwidth(userId, year = null, month = null) {
  try {
    const now = moment();
    const targetYear = year || now.year();
    const targetMonth = month || (now.month() + 1);

    const bandwidth = await db.Bandwidth.findAll({
      where: {
        userId,
        year: targetYear,
        month: targetMonth
      },
      include: [
        {
          model: db.Audio,
          as: 'audio',
          attributes: ['id', 'title']
        }
      ]
    });

    const total = bandwidth.reduce((sum, b) => sum + parseInt(b.bytesUsed), 0);
    const byType = {
      download: bandwidth.filter(b => b.type === 'download').reduce((sum, b) => sum + parseInt(b.bytesUsed), 0),
      stream: bandwidth.filter(b => b.type === 'stream').reduce((sum, b) => sum + parseInt(b.bytesUsed), 0),
      upload: bandwidth.filter(b => b.type === 'upload').reduce((sum, b) => sum + parseInt(b.bytesUsed), 0)
    };

    return {
      success: true,
      total,
      byType,
      records: bandwidth
    };
  } catch (error) {
    console.error('Get bandwidth error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  trackBandwidth,
  resetMonthlyBandwidth,
  getUserBandwidth
};

