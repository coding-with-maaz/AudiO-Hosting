const db = require('../models');
const { Op } = require('sequelize');

// Favorites
exports.addFavorite = async (req, res, next) => {
  try {
    const { audioId } = req.params;

    const audio = await db.Audio.findByPk(audioId);
    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    const [favorite, created] = await db.Favorite.findOrCreate({
      where: { userId: req.user.id, audioId },
      defaults: { userId: req.user.id, audioId }
    });

    if (!created) {
      return res.status(400).json({
        success: false,
        message: 'Audio already in favorites'
      });
    }

    res.json({
      success: true,
      message: 'Added to favorites',
      data: { favorite }
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const { audioId } = req.params;

    const deleted = await db.Favorite.destroy({
      where: { userId: req.user.id, audioId }
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await db.Favorite.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.Audio,
          as: 'audio',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { favorites }
    });
  } catch (error) {
    next(error);
  }
};

// Comments
exports.addComment = async (req, res, next) => {
  try {
    const { audioId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const audio = await db.Audio.findByPk(audioId);
    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    const comment = await db.Comment.create({
      userId: req.user.id,
      audioId,
      content: content.trim(),
      parentId: parentId || null
    });

    const created = await db.Comment.findByPk(comment.id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: db.Comment,
          as: 'replies',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'username', 'avatar'] }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: { comment: created }
    });
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const { audioId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Comment.findAndCountAll({
      where: {
        audioId,
        parentId: null,
        isDeleted: false
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: db.Comment,
          as: 'replies',
          where: { isDeleted: false },
          required: false,
          include: [{ model: db.User, as: 'user', attributes: ['id', 'username', 'avatar'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        comments: rows,
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

exports.updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await db.Comment.findOne({
      where: { id, userId: req.user.id }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.update({
      content: content.trim(),
      isEdited: true
    });

    res.json({
      success: true,
      message: 'Comment updated',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await db.Comment.findOne({
      where: { id, userId: req.user.id }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.update({
      isDeleted: true,
      content: '[Deleted]'
    });

    res.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    next(error);
  }
};

// Ratings
exports.addRating = async (req, res, next) => {
  try {
    const { audioId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const audio = await db.Audio.findByPk(audioId);
    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    const [userRating, created] = await db.Rating.findOrCreate({
      where: { userId: req.user.id, audioId },
      defaults: {
        userId: req.user.id,
        audioId,
        rating: parseInt(rating)
      }
    });

    if (!created) {
      await userRating.update({ rating: parseInt(rating) });
    }

    // Calculate average rating
    const ratings = await db.Rating.findAll({
      where: { audioId },
      attributes: [
        [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'average'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      raw: true
    });

    res.json({
      success: true,
      message: 'Rating added',
      data: {
        rating: userRating,
        average: parseFloat(ratings[0]?.average || 0),
        count: parseInt(ratings[0]?.count || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRatings = async (req, res, next) => {
  try {
    const { audioId } = req.params;

    const ratings = await db.Rating.findAll({
      where: { audioId },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = await db.Rating.findOne({
      where: { audioId },
      attributes: [
        [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'average'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        ratings,
        stats: {
          average: parseFloat(stats?.average || 0),
          count: parseInt(stats?.count || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

