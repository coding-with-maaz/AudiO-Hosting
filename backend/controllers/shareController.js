const db = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Generate share token
const generateShareToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Get direct download link
exports.getDirectLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.query;

    const audio = await db.Audio.findByPk(id, {
      include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }]
    });

    if (!audio || !audio.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    // Check password if set
    if (audio.password) {
      if (!password || audio.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Password required or incorrect'
        });
      }
    }

    // Check access
    if (!audio.isPublic && audio.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate share token if not exists
    if (!audio.shareToken) {
      const shareToken = generateShareToken();
      await audio.update({ shareToken });
      audio.shareToken = shareToken;
    }

    // Track view
    if (req.user) {
      await db.Analytics.create({
        userId: req.user.id,
        audioId: audio.id,
        eventType: 'view',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      await audio.increment('views');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const embedUrl = `${frontendUrl}/e/${audio.shareToken}`;
    const embedUrlTransparent = `${frontendUrl}/e/${audio.shareToken}?transparent=true`;

    res.json({
      success: true,
      data: {
        audio: {
          id: audio.id,
          title: audio.title,
          duration: audio.duration,
          fileSize: audio.fileSize
        },
        links: {
          directDownload: `${baseUrl}/d/${audio.shareToken}`,
          embed: embedUrl,
          embedTransparent: embedUrlTransparent,
          embedCodes: {
            standard: `<iframe src="${embedUrl}" width="100%" height="400" frameborder="0" allow="autoplay" style="border-radius: 12px;"></iframe>`,
            transparent: `<iframe src="${embedUrlTransparent}" width="100%" height="400" frameborder="0" allow="autoplay" style="background: transparent; border: none;"></iframe>`,
            minimal: `<iframe src="${embedUrl}?compact=true" width="100%" height="120" frameborder="0" allow="autoplay" style="border-radius: 8px;"></iframe>`,
            compactTransparent: `<iframe src="${embedUrlTransparent}&compact=true" width="100%" height="120" frameborder="0" allow="autoplay" style="background: transparent; border: none;"></iframe>`,
            autoPlay: `<iframe src="${embedUrl}?autoplay=true" width="100%" height="400" frameborder="0" allow="autoplay" style="border-radius: 12px;"></iframe>`,
            autoPlayTransparent: `<iframe src="${embedUrlTransparent}&autoplay=true" width="100%" height="400" frameborder="0" allow="autoplay" style="background: transparent; border: none;"></iframe>`
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Serve direct download
exports.serveDirectDownload = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.query;

    // Try to get user from token (optional auth)
    let user = null;
    try {
      const jwt = require('jsonwebtoken');
      const config = require('../config/config');
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
      if (token) {
        const decoded = jwt.verify(token, config.jwt.secret);
        user = await db.User.findByPk(decoded.userId);
      }
    } catch (error) {
      // Token invalid or not provided, continue without user
    }

    // Find by shareToken or id
    const audio = await db.Audio.findOne({
      where: {
        [Op.or]: [
          { shareToken: id },
          { id: id }
        ],
        isActive: true
      }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    // Check access - allow if public, has shareToken match, or user owns it
    const isOwner = user && String(audio.userId) === String(user.id);
    const hasShareToken = audio.shareToken === id;
    
    // If user owns the audio but it doesn't have a shareToken, generate one
    if (isOwner && !audio.shareToken) {
      const shareToken = generateShareToken();
      await audio.update({ shareToken });
      audio.shareToken = shareToken;
    }
    
    if (!audio.isPublic && !hasShareToken && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check password if set
    if (audio.password) {
      if (!password || audio.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Password required or incorrect'
        });
      }
    }

    if (!fs.existsSync(audio.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Track download
    await db.Analytics.create({
      userId: audio.userId,
      audioId: audio.id,
      eventType: 'download',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    await audio.increment('downloads');

    // Track bandwidth
    const fileSize = fs.statSync(audio.filePath).size;
    const { trackBandwidth } = require('../utils/bandwidthTracker');
    if (user) {
      await trackBandwidth(user.id, fileSize, 'download', audio.id, req.ip);
    }

    res.download(audio.filePath, audio.originalFilename);
  } catch (error) {
    next(error);
  }
};

// Serve embed page - redirect to frontend embed page with custom player
exports.serveEmbed = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find by shareToken or id
    const audio = await db.Audio.findOne({
      where: {
        [Op.or]: [
          { shareToken: id },
          { id: id }
        ],
        isActive: true
      },
      include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }]
    });

    if (!audio) {
      return res.status(404).send('Audio not found');
    }

    // Check access
    if (!audio.isPublic && audio.userId !== req.user?.id) {
      return res.status(403).send('Access denied');
    }

    // Track play
    await db.Analytics.create({
      userId: audio.userId,
      audioId: audio.id,
      eventType: 'play',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    await audio.increment('views');

    // Redirect to frontend embed page with custom player
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const embedToken = audio.shareToken || audio.id;
    
    // Return HTML that redirects to frontend embed page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0;url=${frontendUrl}/e/${embedToken}">
    <title>Redirecting to Audio Player...</title>
    <script>
        window.location.href = "${frontendUrl}/e/${embedToken}";
    </script>
</head>
<body>
    <p>Redirecting to audio player... <a href="${frontendUrl}/e/${embedToken}">Click here if not redirected</a></p>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    next(error);
  }
};

// Helper function
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

