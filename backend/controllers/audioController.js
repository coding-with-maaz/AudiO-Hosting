const db = require('../models');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { checkDuplicate, storeFileHash } = require('../utils/duplicateDetector');
const { triggerWebhook } = require('./webhookController');

exports.uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description, isPublic, tags } = req.body;
    const user = await db.User.findByPk(req.user.id);

    // Check storage limit
    const fileSize = parseInt(req.file.size);
    if (user.storageUsed + fileSize > user.storageLimit) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Storage limit exceeded'
      });
    }

    const { folderId } = req.body;
    
    // Verify folder belongs to user if provided
    if (folderId) {
      const folder = await db.Folder.findOne({
        where: { id: folderId, userId: user.id }
      });
      if (!folder) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }

    // Check for duplicates
    const duplicateCheck = await checkDuplicate(user.id, req.file.path);
    
    if (duplicateCheck.isDuplicate) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Duplicate file detected',
        data: {
          duplicateId: duplicateCheck.duplicateId,
          existingAudio: await db.Audio.findByPk(duplicateCheck.duplicateId)
        }
      });
    }

    const expirationDate = req.body.expirationDate ? new Date(req.body.expirationDate) : null;

    const audio = await db.Audio.create({
      userId: user.id,
      folderId: folderId || null,
      title: title || req.file.originalname,
      description: description || null,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: fileSize,
      mimeType: req.file.mimetype,
      isPublic: isPublic !== undefined ? isPublic === 'true' : true,
      tags: tags ? JSON.parse(tags) : [],
      expirationDate: expirationDate,
      metadata: {
        fileHash: duplicateCheck.fileHash
      }
    });

    // Store file hash
    await storeFileHash(audio.id, duplicateCheck.fileHash);

    // Update user storage
    await user.increment('storageUsed', { by: fileSize });

    // Trigger webhook
    await triggerWebhook(user.id, 'audio.uploaded', {
      audioId: audio.id,
      title: audio.title,
      fileSize: audio.fileSize
    });

    res.status(201).json({
      success: true,
      message: 'Audio uploaded successfully',
      data: { audio }
    });
  } catch (error) {
    // Delete file if audio creation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

exports.getAudios = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, userId, isPublic } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await db.Audio.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
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

exports.getAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audio = await db.Audio.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    // Check if user has access
    if (!audio.isPublic && audio.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Track view
    if (req.user) {
      await db.Analytics.create({
        userId: req.user.id,
        audioId: audio.id,
        eventType: 'view',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        referrer: req.get('referer')
      });
      await audio.increment('views');
    }

    res.json({
      success: true,
      data: { audio }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic, tags, folderId, password } = req.body;

    const audio = await db.Audio.findOne({
      where: { id, userId: req.user.id }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    // Verify folder if provided
    if (folderId !== undefined) {
      if (folderId) {
        const folder = await db.Folder.findOne({
          where: { id: folderId, userId: req.user.id }
        });
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: 'Folder not found'
          });
        }
      }
    }

    await audio.update({
      title: title || audio.title,
      description: description !== undefined ? description : audio.description,
      isPublic: isPublic !== undefined ? isPublic === 'true' : audio.isPublic,
      tags: tags ? JSON.parse(tags) : audio.tags,
      folderId: folderId !== undefined ? folderId : audio.folderId,
      password: password !== undefined ? password : audio.password
    });

    res.json({
      success: true,
      message: 'Audio updated successfully',
      data: { audio }
    });
  } catch (error) {
    next(error);
  }
};

exports.renameAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const audio = await db.Audio.findOne({
      where: { id, userId: req.user.id }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    await audio.update({ title: title.trim() });

    res.json({
      success: true,
      message: 'Audio renamed successfully',
      data: { audio }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const audio = await db.Audio.findOne({
      where: { id, userId: req.user.id }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    if (permanent === 'true') {
      // Permanent delete
      if (fs.existsSync(audio.filePath)) {
        fs.unlinkSync(audio.filePath);
      }
      const user = await db.User.findByPk(req.user.id);
      await user.decrement('storageUsed', { by: audio.fileSize });
      await audio.destroy();
    } else {
      // Soft delete (move to trash)
      await audio.update({
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false
      });
    }

    res.json({
      success: true,
      message: permanent === 'true' ? 'Audio permanently deleted' : 'Audio moved to trash'
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audio = await db.Audio.findByPk(id);

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    // Check access
    if (!audio.isPublic && audio.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!fs.existsSync(audio.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Track download
    if (req.user) {
      await db.Analytics.create({
        userId: req.user.id,
        audioId: audio.id,
        eventType: 'download',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      await audio.increment('downloads');
    }

    res.download(audio.filePath, audio.originalFilename);
  } catch (error) {
    next(error);
  }
};

exports.getMyAudios = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Audio.findAndCountAll({
      where: { userId: req.user.id },
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

// Browse public audios from other users
exports.getPublicAudios = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      isPublic: true,
      isActive: true,
      isDeleted: false
    };

    // Exclude current user's own audios if authenticated
    if (req.user) {
      where.userId = { [Op.ne]: req.user.id };
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { tags: { [Op.like]: `%${search}%` } }
      ];
    }

    // Sort options
    const sortOptions = {
      createdAt: [['createdAt', order.toUpperCase()]],
      views: [['views', order.toUpperCase()]],
      downloads: [['downloads', order.toUpperCase()]],
      likes: [['likes', order.toUpperCase()]],
      title: [['title', order.toUpperCase()]]
    };

    const { count, rows } = await db.Audio.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: sortOptions[sortBy] || sortOptions.createdAt,
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

// Clone an audio from another user
exports.cloneAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;

    console.log('Clone request:', { id, folderId, userId: req.user?.id });

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Audio ID or shareToken is required'
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find the original audio by ID or shareToken
    const originalAudio = await db.Audio.findOne({
      where: {
        [Op.or]: [
          { id },
          { shareToken: id }
        ],
        isActive: true,
        isDeleted: false
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!originalAudio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found or has been deleted'
      });
    }

    // Check if audio is public
    if (!originalAudio.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This audio is not public and cannot be cloned'
      });
    }

    // Check if user is trying to clone their own audio
    if (String(originalAudio.userId) === String(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot clone your own audio'
      });
    }

    // Check if file exists
    if (!fs.existsSync(originalAudio.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    const user = await db.User.findByPk(req.user.id);

    // Check storage limit
    if (user.storageUsed + originalAudio.fileSize > user.storageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Storage limit exceeded'
      });
    }

    // Verify folder if provided
    if (folderId) {
      const folder = await db.Folder.findOne({
        where: { id: folderId, userId: user.id }
      });
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }

    // Generate new filename
    const timestamp = Date.now();
    const ext = path.extname(originalAudio.filename);
    const baseName = path.basename(originalAudio.filename, ext);
    const newFilename = `${baseName}_clone_${timestamp}${ext}`;
    const uploadDir = path.dirname(originalAudio.filePath);
    const newFilePath = path.join(uploadDir, newFilename);

    // Copy the file
    fs.copyFileSync(originalAudio.filePath, newFilePath);

    // Parse metadata if it's a string
    let originalMetadata = {};
    if (originalAudio.metadata) {
      originalMetadata = typeof originalAudio.metadata === 'string' 
        ? JSON.parse(originalAudio.metadata) 
        : originalAudio.metadata;
    }

    // Create cloned audio record
    const clonedAudio = await db.Audio.create({
      userId: user.id,
      folderId: folderId || null,
      title: `${originalAudio.title} (Cloned)`,
      description: originalAudio.description ? `Cloned from: ${originalAudio.user?.username || 'Unknown'}\n\n${originalAudio.description}` : `Cloned from: ${originalAudio.user?.username || 'Unknown'}`,
      filename: newFilename,
      originalFilename: originalAudio.originalFilename,
      filePath: newFilePath,
      fileSize: originalAudio.fileSize,
      duration: originalAudio.duration || null,
      mimeType: originalAudio.mimeType,
      thumbnail: originalAudio.thumbnail || null,
      isPublic: false, // Cloned audios are private by default
      tags: Array.isArray(originalAudio.tags) ? originalAudio.tags : [],
      metadata: {
        ...originalMetadata,
        clonedFrom: originalAudio.id,
        clonedAt: new Date().toISOString(),
        originalOwner: originalAudio.userId
      }
    });

    // Update user storage
    await user.increment('storageUsed', { by: originalAudio.fileSize });

    // Increment clone count on original audio (if tracking)
    if (originalAudio.metadata) {
      const metadata = typeof originalAudio.metadata === 'string' 
        ? JSON.parse(originalAudio.metadata) 
        : originalAudio.metadata;
      metadata.cloneCount = (metadata.cloneCount || 0) + 1;
      await originalAudio.update({ metadata });
    } else {
      await originalAudio.update({
        metadata: { cloneCount: 1 }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Audio cloned successfully',
      data: { audio: clonedAudio }
    });
  } catch (error) {
    console.error('Clone audio error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to clone audio',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

