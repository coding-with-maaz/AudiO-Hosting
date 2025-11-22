const db = require('../models');
const fs = require('fs');
const { Op } = require('sequelize');

exports.getTrash = async (req, res, next) => {
  try {
    const { type = 'audio' } = req.query;

    if (type === 'audio') {
      const audios = await db.Audio.findAll({
        where: {
          userId: req.user.id,
          isDeleted: true
        },
        order: [['deletedAt', 'DESC']]
      });

      return res.json({
        success: true,
        data: { audios }
      });
    } else if (type === 'folder') {
      // Folders don't have soft delete yet, but we can add it
      return res.json({
        success: true,
        data: { folders: [] }
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid type. Use "audio" or "folder"'
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreAudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const audio = await db.Audio.findOne({
      where: {
        id,
        userId: req.user.id,
        isDeleted: true
      }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found in trash'
      });
    }

    await audio.update({
      isDeleted: false,
      deletedAt: null,
      isActive: true
    });

    res.json({
      success: true,
      message: 'Audio restored successfully',
      data: { audio }
    });
  } catch (error) {
    next(error);
  }
};

exports.emptyTrash = async (req, res, next) => {
  try {
    const { type = 'audio' } = req.query;

    if (type === 'audio') {
      const audios = await db.Audio.findAll({
        where: {
          userId: req.user.id,
          isDeleted: true
        }
      });

      const user = await db.User.findByPk(req.user.id);
      let totalSize = 0;

      for (const audio of audios) {
        if (fs.existsSync(audio.filePath)) {
          fs.unlinkSync(audio.filePath);
        }
        totalSize += audio.fileSize;
        await audio.destroy(); // Hard delete
      }

      await user.decrement('storageUsed', { by: totalSize });

      return res.json({
        success: true,
        message: `Permanently deleted ${audios.length} audio file(s)`,
        data: { deleted: audios.length }
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid type'
    });
  } catch (error) {
    next(error);
  }
};

// Update audioController delete to use soft delete
// This will be handled by updating the existing deleteAudio function

