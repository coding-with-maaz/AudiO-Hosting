const db = require('../models');
const { Op } = require('sequelize');

exports.createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic, coverImage, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Playlist name is required'
      });
    }

    const playlist = await db.Playlist.create({
      userId: req.user.id,
      name,
      description: description || null,
      isPublic: isPublic || false,
      coverImage: coverImage || null,
      sortOrder: sortOrder || 'manual'
    });

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: { playlist }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlaylists = async (req, res, next) => {
  try {
    const { userId, isPublic } = req.query;
    const where = {};

    if (userId) {
      where.userId = userId;
    } else {
      where.userId = req.user.id;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const playlists = await db.Playlist.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: db.Audio,
          as: 'audios',
          through: { attributes: ['order', 'addedAt'] },
          include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { playlists }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const playlist = await db.Playlist.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: db.Audio,
          as: 'audios',
          through: { 
            model: db.PlaylistAudio,
            attributes: ['order', 'addedAt'] 
          },
          include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }],
          order: [[db.PlaylistAudio, 'order', 'ASC']]
        }
      ]
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check access
    if (!playlist.isPublic && playlist.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { playlist }
    });
  } catch (error) {
    next(error);
  }
};

exports.addToPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { audioIds } = req.body;

    if (!audioIds || !Array.isArray(audioIds) || audioIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'audioIds array is required'
      });
    }

    const playlist = await db.Playlist.findOne({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Get current max order
    const maxOrder = await db.PlaylistAudio.findOne({
      where: { playlistId: id },
      attributes: [
        [db.sequelize.fn('MAX', db.sequelize.col('order')), 'maxOrder']
      ],
      raw: true
    });

    let order = (maxOrder?.maxOrder || 0) + 1;

    const results = [];
    for (const audioId of audioIds) {
      const [playlistAudio, created] = await db.PlaylistAudio.findOrCreate({
        where: { playlistId: id, audioId },
        defaults: {
          playlistId: id,
          audioId,
          order: order++
        }
      });

      if (!created) {
        await playlistAudio.update({ order: order++ });
      }

      results.push(playlistAudio);
    }

    res.json({
      success: true,
      message: `Added ${results.length} audio(s) to playlist`,
      data: { added: results.length }
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromPlaylist = async (req, res, next) => {
  try {
    const { id, audioId } = req.params;

    const playlist = await db.Playlist.findOne({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    const deleted = await db.PlaylistAudio.destroy({
      where: { playlistId: id, audioId }
    });

    res.json({
      success: true,
      message: 'Audio removed from playlist',
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlaylistOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { audioOrders } = req.body; // [{ audioId, order }, ...]

    if (!audioOrders || !Array.isArray(audioOrders)) {
      return res.status(400).json({
        success: false,
        message: 'audioOrders array is required'
      });
    }

    const playlist = await db.Playlist.findOne({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    for (const { audioId, order } of audioOrders) {
      await db.PlaylistAudio.update(
        { order },
        { where: { playlistId: id, audioId } }
      );
    }

    res.json({
      success: true,
      message: 'Playlist order updated'
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic, coverImage, sortOrder } = req.body;

    const playlist = await db.Playlist.findOne({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    await playlist.update({
      name: name || playlist.name,
      description: description !== undefined ? description : playlist.description,
      isPublic: isPublic !== undefined ? isPublic : playlist.isPublic,
      coverImage: coverImage !== undefined ? coverImage : playlist.coverImage,
      sortOrder: sortOrder || playlist.sortOrder
    });

    res.json({
      success: true,
      message: 'Playlist updated successfully',
      data: { playlist }
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const playlist = await db.Playlist.findOne({
      where: { id, userId: req.user.id }
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    await playlist.destroy();

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

