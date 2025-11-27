const db = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const constants = require('../constants');

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
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.AUDIO_NOT_FOUND
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
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.ACCESS_DENIED
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
    const frontendUrl = constants.URLS.DEFAULT_FRONTEND_URL;
    const embedUrl = `${frontendUrl}${constants.PUBLIC_ROUTES.EMBED}/${audio.shareToken}`;
    const embedUrlTransparent = `${embedUrl}?${constants.QUERY_PARAMS.TRANSPARENT}=${constants.BOOLEAN_STRINGS.TRUE}`;
    const embedUrlCompact = `${embedUrl}?${constants.QUERY_PARAMS.COMPACT}=${constants.BOOLEAN_STRINGS.TRUE}`;
    const embedUrlAutoplay = `${embedUrl}?${constants.QUERY_PARAMS.AUTOPLAY}=${constants.BOOLEAN_STRINGS.TRUE}`;

    res.json({
      [constants.RESPONSE_KEYS.SUCCESS]: true,
      [constants.RESPONSE_KEYS.DATA]: {
        audio: {
          id: audio.id,
          title: audio.title,
          duration: audio.duration,
          fileSize: audio.fileSize
        },
        links: {
          directDownload: `${baseUrl}${constants.PUBLIC_ROUTES.DIRECT_DOWNLOAD}/${audio.shareToken}`,
          embed: embedUrl,
          embedTransparent: embedUrlTransparent,
          embedCodes: {
            standard: constants.EMBED_TEMPLATES.STANDARD(embedUrl),
            transparent: constants.EMBED_TEMPLATES.TRANSPARENT(embedUrlTransparent),
            minimal: constants.EMBED_TEMPLATES.MINIMAL(embedUrlCompact),
            compactTransparent: constants.EMBED_TEMPLATES.COMPACT_TRANSPARENT(`${embedUrlTransparent}&${constants.QUERY_PARAMS.COMPACT}=${constants.BOOLEAN_STRINGS.TRUE}`),
            autoPlay: constants.EMBED_TEMPLATES.AUTOPLAY(embedUrlAutoplay),
            autoPlayTransparent: constants.EMBED_TEMPLATES.AUTOPLAY_TRANSPARENT(`${embedUrlTransparent}&${constants.QUERY_PARAMS.AUTOPLAY}=${constants.BOOLEAN_STRINGS.TRUE}`)
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
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.AUDIO_NOT_FOUND
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
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.ACCESS_DENIED
      });
    }
    
    // Check password if set
    if (audio.password) {
      if (!password || audio.password !== password) {
        return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
          [constants.RESPONSE_KEYS.SUCCESS]: false,
          [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.PASSWORD_REQUIRED
        });
      }
    }

    if (!fs.existsSync(audio.filePath)) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        [constants.RESPONSE_KEYS.SUCCESS]: false,
        [constants.RESPONSE_KEYS.MESSAGE]: constants.MESSAGES.FILE_NOT_FOUND
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
      return res.status(constants.HTTP_STATUS.NOT_FOUND).send(constants.MESSAGES.AUDIO_NOT_FOUND);
    }

    // Check access
    if (!audio.isPublic && audio.userId !== req.user?.id) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).send(constants.MESSAGES.ACCESS_DENIED);
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
    const frontendUrl = constants.URLS.DEFAULT_FRONTEND_URL;
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

