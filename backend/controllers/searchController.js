const db = require('../models');
const { Op } = require('sequelize');

exports.searchAudios = async (req, res, next) => {
  try {
    const {
      q, // search query
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      minSize,
      maxSize,
      minDuration,
      maxDuration,
      mimeType,
      tags,
      userId,
      folderId,
      isPublic,
      dateFrom,
      dateTo
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const order = [[sortBy, sortOrder.toUpperCase()]];

    // Search query
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ];
    }

    // Filters
    if (userId) where.userId = userId;
    if (folderId !== undefined) {
      if (folderId === null || folderId === 'null') {
        where.folderId = null;
      } else {
        where.folderId = folderId;
      }
    }
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';
    if (mimeType) where.mimeType = mimeType;

    // Size filters
    if (minSize || maxSize) {
      where.fileSize = {};
      if (minSize) where.fileSize[Op.gte] = parseInt(minSize);
      if (maxSize) where.fileSize[Op.lte] = parseInt(maxSize);
    }

    // Duration filters
    if (minDuration || maxDuration) {
      where.duration = {};
      if (minDuration) where.duration[Op.gte] = parseInt(minDuration);
      if (maxDuration) where.duration[Op.lte] = parseInt(maxDuration);
    }

    // Date filters
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        [Op.overlap]: tagArray
      };
    }

    // Only active, non-deleted audios
    where.isActive = true;
    where.isDeleted = false;

    const { count, rows } = await db.Audio.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: db.Folder,
          as: 'folder',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order,
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
        },
        filters: {
          query: q,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFilters = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const where = { isActive: true, isDeleted: false };
    if (userId) where.userId = userId;

    // Get unique mime types
    const mimeTypes = await db.Audio.findAll({
      attributes: [
        [db.sequelize.fn('DISTINCT', db.sequelize.col('mimeType')), 'mimeType']
      ],
      where,
      raw: true
    });

    // Get all unique tags
    const audios = await db.Audio.findAll({
      attributes: ['tags'],
      where,
      raw: true
    });

    const allTags = new Set();
    audios.forEach(audio => {
      if (audio.tags && Array.isArray(audio.tags)) {
        audio.tags.forEach(tag => allTags.add(tag));
      }
    });

    // Get size range
    const sizeStats = await db.Audio.findOne({
      attributes: [
        [db.sequelize.fn('MIN', db.sequelize.col('fileSize')), 'minSize'],
        [db.sequelize.fn('MAX', db.sequelize.col('fileSize')), 'maxSize']
      ],
      where,
      raw: true
    });

    // Get duration range
    const durationStats = await db.Audio.findOne({
      attributes: [
        [db.sequelize.fn('MIN', db.sequelize.col('duration')), 'minDuration'],
        [db.sequelize.fn('MAX', db.sequelize.col('duration')), 'maxDuration']
      ],
      where: { ...where, duration: { [Op.ne]: null } },
      raw: true
    });

    res.json({
      success: true,
      data: {
        mimeTypes: mimeTypes.map(m => m.mimeType),
        tags: Array.from(allTags),
        sizeRange: {
          min: parseInt(sizeStats?.minSize || 0),
          max: parseInt(sizeStats?.maxSize || 0)
        },
        durationRange: {
          min: parseInt(durationStats?.minDuration || 0),
          max: parseInt(durationStats?.maxDuration || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

