const db = require('../models');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

exports.uploadFromUrl = async (req, res, next) => {
  try {
    const { url, title, description, folderId, isPublic } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const user = await db.User.findByPk(req.user.id);

    // Download file from URL
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 300000, // 5 minutes
      maxContentLength: config.upload.maxSize,
      maxBodyLength: config.upload.maxSize
    });

    // Get content type and filename
    const contentType = response.headers['content-type'];
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'audio_file';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Try to get from URL
      const urlPath = new URL(url).pathname;
      const urlFilename = path.basename(urlPath);
      if (urlFilename) {
        filename = urlFilename;
      }
    }

    // Validate content type
    if (!config.upload.allowedTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type: ${contentType}`
      });
    }

    // Create user directory
    const userDir = path.join(config.upload.dir, user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(filename)}`;
    const filePath = path.join(userDir, uniqueName);

    // Save file
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Check storage limit
    if (user.storageUsed + fileSize > user.storageLimit) {
      fs.unlinkSync(filePath);
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
        fs.unlinkSync(filePath);
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }

    // Create audio record
    const audio = await db.Audio.create({
      userId: user.id,
      folderId: folderId || null,
      title: title || filename,
      description: description || null,
      filename: uniqueName,
      originalFilename: filename,
      filePath: filePath,
      fileSize: fileSize,
      mimeType: contentType,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    // Update user storage
    await user.increment('storageUsed', { by: fileSize });

    res.status(201).json({
      success: true,
      message: 'Audio uploaded from URL successfully',
      data: { audio }
    });
  } catch (error) {
    if (error.response) {
      return res.status(400).json({
        success: false,
        message: 'Failed to download file from URL',
        error: error.message
      });
    }
    next(error);
  }
};

