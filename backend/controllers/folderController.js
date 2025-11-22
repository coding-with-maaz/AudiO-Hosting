const db = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// Generate share token
const generateShareToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

exports.createFolder = async (req, res, next) => {
  try {
    const { name, description, parentFolderId, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // Check parent folder exists and belongs to user
    if (parentFolderId) {
      const parentFolder = await db.Folder.findOne({
        where: { id: parentFolderId, userId: req.user.id }
      });

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    const folder = await db.Folder.create({
      userId: req.user.id,
      name,
      description: description || null,
      parentFolderId: parentFolderId || null,
      isPublic: isPublic || false
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFolders = async (req, res, next) => {
  try {
    const { parentFolderId } = req.query;
    const where = { userId: req.user.id };
    
    if (parentFolderId === null || parentFolderId === 'null') {
      where.parentFolderId = null;
    } else if (parentFolderId) {
      where.parentFolderId = parentFolderId;
    }

    const folders = await db.Folder.findAll({
      where,
      include: [
        {
          model: db.Folder,
          as: 'subfolders',
          attributes: ['id', 'name']
        },
        {
          model: db.Audio,
          as: 'audios',
          attributes: ['id', 'title', 'fileSize', 'duration', 'mimeType']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { folders }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await db.Folder.findOne({
      where: { id, userId: req.user.id },
      include: [
        {
          model: db.Folder,
          as: 'subfolders'
        },
        {
          model: db.Audio,
          as: 'audios',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }]
        },
        {
          model: db.Folder,
          as: 'parentFolder',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    res.json({
      success: true,
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic, password } = req.body;

    const folder = await db.Folder.findOne({
      where: { id, userId: req.user.id }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    await folder.update({
      name: name || folder.name,
      description: description !== undefined ? description : folder.description,
      isPublic: isPublic !== undefined ? isPublic : folder.isPublic,
      password: password !== undefined ? password : folder.password
    });

    res.json({
      success: true,
      message: 'Folder updated successfully',
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

exports.renameFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    const folder = await db.Folder.findOne({
      where: { id, userId: req.user.id }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    await folder.update({ name: name.trim() });

    res.json({
      success: true,
      message: 'Folder renamed successfully',
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await db.Folder.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: db.Audio, as: 'audios' }]
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Check if folder has subfolders
    const subfolders = await db.Folder.count({
      where: { parentFolderId: id }
    });

    if (subfolders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete folder with subfolders. Please delete subfolders first.'
      });
    }

    // Move audios to root (or delete them - you can choose)
    if (folder.audios && folder.audios.length > 0) {
      await db.Audio.update(
        { folderId: null },
        { where: { folderId: id } }
      );
    }

    await folder.destroy();

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.enableFolderSharing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const folder = await db.Folder.findOne({
      where: { id, userId: req.user.id }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    const shareToken = folder.shareToken || generateShareToken();

    await folder.update({
      isShared: true,
      shareToken,
      password: password || null
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      message: 'Folder sharing enabled',
      data: {
        folder,
        shareLink: `${baseUrl}/f/${shareToken}`,
        embedLink: `${baseUrl}/f/${shareToken}?embed=true`
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.disableFolderSharing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await db.Folder.findOne({
      where: { id, userId: req.user.id }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    await folder.update({
      isShared: false,
      shareToken: null,
      password: null
    });

    res.json({
      success: true,
      message: 'Folder sharing disabled'
    });
  } catch (error) {
    next(error);
  }
};

exports.getSharedFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, embed } = req.query;

    const folder = await db.Folder.findOne({
      where: { shareToken: id, isShared: true },
      include: [
        {
          model: db.Audio,
          as: 'audios',
          where: { isActive: true },
          required: false,
          include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }]
        },
        {
          model: db.Folder,
          as: 'subfolders',
          where: { isShared: true },
          required: false
        }
      ]
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or sharing disabled'
      });
    }

    // Check password if set
    if (folder.password) {
      if (!password || folder.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Password required or incorrect'
        });
      }
    }

    // If embed mode, return HTML page
    if (embed === 'true') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const html = generateFolderEmbedHTML(folder, baseUrl);
      return res.send(html);
    }

    res.json({
      success: true,
      data: { folder }
    });
  } catch (error) {
    next(error);
  }
};

exports.exportFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await db.Folder.findOne({
      where: { id, userId: req.user.id },
      include: [
        {
          model: db.Audio,
          as: 'audios',
          where: { isActive: true },
          required: false
        },
        {
          model: db.Folder,
          as: 'subfolders',
          required: false
        }
      ]
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`${folder.name}.zip`);
    archive.pipe(res);

    // Add all audios to archive
    for (const audio of folder.audios) {
      if (fs.existsSync(audio.filePath)) {
        archive.file(audio.filePath, { name: audio.originalFilename });
      }
    }

    // Recursively add subfolders
    await addSubfoldersToArchive(archive, folder.id, folder.name);

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};

async function addSubfoldersToArchive(archive, folderId, parentPath) {
  const subfolders = await db.Folder.findAll({
    where: { parentFolderId: folderId },
    include: [{ model: db.Audio, as: 'audios', required: false }]
  });

  for (const subfolder of subfolders) {
    const currentPath = `${parentPath}/${subfolder.name}`;
    
    for (const audio of subfolder.audios) {
      if (fs.existsSync(audio.filePath)) {
        archive.file(audio.filePath, { name: `${currentPath}/${audio.originalFilename}` });
      }
    }

    await addSubfoldersToArchive(archive, subfolder.id, currentPath);
  }
}

function generateFolderEmbedHTML(folder, baseUrl) {
  const audioList = folder.audios.map(audio => {
    const audioUrl = `${baseUrl}/d/${audio.shareToken || audio.id}`;
    return `
      <div class="audio-item">
        <div class="audio-title">${audio.title}</div>
        <audio controls>
          <source src="${audioUrl}" type="${audio.mimeType}">
        </audio>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${folder.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            padding: 20px;
            color: #fff;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .folder-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .folder-description {
            color: #aaa;
            margin-bottom: 30px;
        }
        .audio-item {
            background: #2a2a2a;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
        }
        .audio-title {
            color: #fff;
            font-size: 16px;
            margin-bottom: 10px;
        }
        audio {
            width: 100%;
            outline: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="folder-title">${folder.name}</div>
        ${folder.description ? `<div class="folder-description">${folder.description}</div>` : ''}
        ${audioList || '<p>No audio files in this folder</p>'}
    </div>
</body>
</html>
  `;
}

