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
          embed: `${baseUrl}/e/${audio.shareToken}`,
          embedCode: `<iframe src="${baseUrl}/e/${audio.shareToken}" width="100%" height="100" frameborder="0" allow="autoplay"></iframe>`
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
    if (req.user) {
      await trackBandwidth(req.user.id, fileSize, 'download', audio.id, req.ip);
    }

    res.download(audio.filePath, audio.originalFilename);
  } catch (error) {
    next(error);
  }
};

// Serve embed page
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const audioUrl = `${baseUrl}/d/${audio.shareToken || audio.id}`;

    // Enhanced player with playback speed and queue
    const playbackSpeed = req.query.speed || '1.0';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${audio.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #1a1a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .player-container {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .audio-title {
            color: #fff;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        audio {
            width: 100%;
            outline: none;
        }
        audio::-webkit-media-controls-panel {
            background-color: #3a3a3a;
        }
        .controls {
            margin-top: 15px;
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
        }
        .speed-control {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .speed-control label {
            color: #aaa;
            font-size: 12px;
        }
        .speed-control select {
            background: #3a3a3a;
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 12px;
        }
        .info {
            color: #aaa;
            font-size: 14px;
            margin-top: 15px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="audio-title">${audio.title}</div>
        <audio id="audioPlayer" controls>
            <source src="${audioUrl}" type="${audio.mimeType}">
            Your browser does not support the audio element.
        </audio>
        <div class="controls">
            <div class="speed-control">
                <label>Speed:</label>
                <select id="playbackSpeed" onchange="changeSpeed()">
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1.0" selected>1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                </select>
            </div>
        </div>
        <div class="info">${audio.user?.username || 'Unknown'} • ${formatFileSize(audio.fileSize)}</div>
    </div>
    <script>
        const audio = document.getElementById('audioPlayer');
        const speedSelect = document.getElementById('playbackSpeed');
        
        function changeSpeed() {
            audio.playbackRate = parseFloat(speedSelect.value);
        }
        
        // Set initial speed
        audio.playbackRate = ${playbackSpeed};
        speedSelect.value = '${playbackSpeed}';
    </script>
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

