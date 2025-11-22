const db = require('../models');
const { Op } = require('sequelize');
const { getUserBandwidth } = require('../utils/bandwidthTracker');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Total users
    const totalUsers = await db.User.count();
    const activeUsers = await db.User.count({ where: { isActive: true } });
    const newUsersToday = await db.User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Total audios
    const totalAudios = await db.Audio.count({ where: { isDeleted: false } });
    const publicAudios = await db.Audio.count({
      where: { isPublic: true, isDeleted: false }
    });

    // Total storage used
    const storageStats = await db.User.findOne({
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('storageUsed')), 'totalStorage'],
        [db.sequelize.fn('SUM', db.sequelize.col('bandwidthUsed')), 'totalBandwidth']
      ],
      raw: true
    });

    // Total revenue
    const revenueStats = await db.Transaction.findOne({
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'totalRevenue']
      ],
      where: {
        type: 'subscription',
        status: 'completed'
      },
      raw: true
    });

    // Active subscriptions
    const activeSubscriptions = await db.Subscription.count({
      where: { status: 'active' }
    });

    // Total affiliates
    const totalAffiliates = await db.Affiliate.count({ where: { isActive: true } });

    // Recent activity
    const recentAudios = await db.Audio.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday
        },
        audios: {
          total: totalAudios,
          public: publicAudios
        },
        storage: {
          totalUsed: parseInt(storageStats?.totalStorage || 0),
          totalBandwidth: parseInt(storageStats?.totalBandwidth || 0)
        },
        revenue: {
          total: parseFloat(revenueStats?.totalRevenue || 0)
        },
        subscriptions: {
          active: activeSubscriptions
        },
        affiliates: {
          total: totalAffiliates
        },
        recentActivity: {
          audios: recentAudios
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, role, isActive } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isActive, storageLimit, bandwidthLimit } = req.body;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (storageLimit !== undefined) updates.storageLimit = parseInt(storageLimit);
    if (bandwidthLimit !== undefined) updates.bandwidthLimit = parseInt(bandwidthLimit);

    await user.update(updates);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (hardDelete === 'true') {
      await user.destroy();
    } else {
      await user.update({
        isActive: false,
        isDeleted: true,
        deletedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAudios = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, userId, isPublic } = req.query;
    const offset = (page - 1) * limit;
    const where = { isDeleted: false };

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (userId) where.userId = userId;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    const { count, rows } = await db.Audio.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        audios: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audio = await db.Audio.findByPk(id);

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    await audio.update({
      isActive: false,
      isDeleted: true,
      deletedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Audio deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserBandwidth = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;

    const bandwidth = await getUserBandwidth(userId, year, month);

    res.json({
      success: true,
      data: bandwidth
    });
  } catch (error) {
    next(error);
  }
};

