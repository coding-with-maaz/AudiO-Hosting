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

