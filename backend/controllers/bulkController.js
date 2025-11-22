const db = require('../models');
const fs = require('fs');
const { Op } = require('sequelize');
const upload = require('../middleware/upload');

exports.bulkUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { folderId, isPublic } = req.body;
    const user = await db.User.findByPk(req.user.id);
    const results = [];
    const errors = [];

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

    for (const file of req.files) {
      try {
        const fileSize = parseInt(file.size);
        
        // Check storage limit
        if (user.storageUsed + fileSize > user.storageLimit) {
          fs.unlinkSync(file.path);
          errors.push({
            filename: file.originalname,
            error: 'Storage limit exceeded'
          });
          continue;
        }

        const audio = await db.Audio.create({
          userId: user.id,
          folderId: folderId || null,
          title: file.originalname,
          filename: file.filename,
          originalFilename: file.originalname,
          filePath: file.path,
          fileSize: fileSize,
          mimeType: file.mimetype,
          isPublic: isPublic === 'true' || isPublic === true
        });

        await user.increment('storageUsed', { by: fileSize });
        results.push(audio);
      } catch (error) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Uploaded ${results.length} file(s)`,
      data: {
        uploaded: results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkDelete = async (req, res, next) => {
  try {
    const { audioIds } = req.body;

    if (!audioIds || !Array.isArray(audioIds) || audioIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'audioIds array is required'
      });
    }

    const audios = await db.Audio.findAll({
      where: {
        id: { [Op.in]: audioIds },
        userId: req.user.id
      }
    });

    if (audios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No audios found'
      });
    }

    const user = await db.User.findByPk(req.user.id);
    let totalSize = 0;

    for (const audio of audios) {
      if (fs.existsSync(audio.filePath)) {
        fs.unlinkSync(audio.filePath);
      }
      totalSize += audio.fileSize;
      await audio.destroy();
    }

    await user.decrement('storageUsed', { by: totalSize });

    res.json({
      success: true,
      message: `Deleted ${audios.length} audio file(s)`,
      data: { deleted: audios.length }
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkMove = async (req, res, next) => {
  try {
    const { audioIds, folderId } = req.body;

    if (!audioIds || !Array.isArray(audioIds) || audioIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'audioIds array is required'
      });
    }

    // Verify folder if provided
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

    const [updated] = await db.Audio.update(
      { folderId: folderId || null },
      {
        where: {
          id: { [Op.in]: audioIds },
          userId: req.user.id
        }
      }
    );

    res.json({
      success: true,
      message: `Moved ${updated} audio file(s)`,
      data: { moved: updated }
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkUpdate = async (req, res, next) => {
  try {
    const { audioIds, updates } = req.body;

    if (!audioIds || !Array.isArray(audioIds) || audioIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'audioIds array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'updates object is required'
      });
    }

    const allowedUpdates = ['isPublic', 'tags'];
    const updateData = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided'
      });
    }

    const [updated] = await db.Audio.update(
      updateData,
      {
        where: {
          id: { [Op.in]: audioIds },
          userId: req.user.id
        }
      }
    );

    res.json({
      success: true,
      message: `Updated ${updated} audio file(s)`,
      data: { updated }
    });
  } catch (error) {
    next(error);
  }
};

