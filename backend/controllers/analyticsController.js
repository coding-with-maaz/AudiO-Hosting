const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.getAudioAnalytics = async (req, res, next) => {
  try {
    const { audioId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify audio ownership
    const audio = await db.Audio.findOne({
      where: { id: audioId, userId: req.user.id }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    const where = { audioId };
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const analytics = await db.Analytics.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Aggregate stats
    const stats = {
      totalViews: analytics.filter(a => a.eventType === 'view').length,
      totalDownloads: analytics.filter(a => a.eventType === 'download').length,
      totalPlays: analytics.filter(a => a.eventType === 'play').length,
      totalLikes: analytics.filter(a => a.eventType === 'like').length,
      totalShares: analytics.filter(a => a.eventType === 'share').length,
      topCountries: getTopCountries(analytics),
      topDevices: getTopDevices(analytics),
      dailyStats: getDailyStats(analytics, startDate, endDate)
    };

    res.json({
      success: true,
      data: { analytics, stats }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { userId: req.user.id };

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const analytics = await db.Analytics.findAll({
      where,
      include: [
        {
          model: db.Audio,
          as: 'audio',
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    const stats = {
      totalEvents: analytics.length,
      byType: groupBy(analytics, 'eventType'),
      topAudios: getTopAudios(analytics),
      dailyStats: getDailyStats(analytics, startDate, endDate)
    };

    res.json({
      success: true,
      data: { analytics, stats }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getTopCountries(analytics) {
  const countries = {};
  analytics.forEach(a => {
    if (a.country) {
      countries[a.country] = (countries[a.country] || 0) + 1;
    }
  });
  return Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));
}

function getTopDevices(analytics) {
  const devices = {};
  analytics.forEach(a => {
    if (a.device) {
      devices[a.device] = (devices[a.device] || 0) + 1;
    }
  });
  return Object.entries(devices)
    .sort((a, b) => b[1] - a[1])
    .map(([device, count]) => ({ device, count }));
}

function getTopAudios(analytics) {
  const audios = {};
  analytics.forEach(a => {
    if (a.audioId) {
      audios[a.audioId] = (audios[a.audioId] || 0) + 1;
    }
  });
  return Object.entries(audios)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([audioId, count]) => ({ audioId, count }));
}

function getDailyStats(analytics, startDate, endDate) {
  const daily = {};
  analytics.forEach(a => {
    const date = moment(a.createdAt).format('YYYY-MM-DD');
    daily[date] = (daily[date] || 0) + 1;
  });
  return Object.entries(daily)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const value = item[key];
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

