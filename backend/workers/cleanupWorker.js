const { cleanupQueue } = require('../config/queue');
const db = require('../models');
const fs = require('fs');
const { Op } = require('sequelize');

cleanupQueue.process('cleanup-expired-files', async (job) => {
  try {
    const now = new Date();
    
    // Find expired audios
    const expiredAudios = await db.Audio.findAll({
      where: {
        expirationDate: {
          [Op.lte]: now
        },
        isDeleted: false
      }
    });

    let deletedCount = 0;
    let totalSize = 0;

    for (const audio of expiredAudios) {
      if (fs.existsSync(audio.filePath)) {
        fs.unlinkSync(audio.filePath);
      }
      
      const user = await db.User.findByPk(audio.userId);
      if (user) {
        await user.decrement('storageUsed', { by: audio.fileSize });
        totalSize += audio.fileSize;
      }

      await audio.update({
        isDeleted: true,
        deletedAt: new Date()
      });

      deletedCount++;
    }

    // Clean up old trash (older than 30 days)
    const oldTrash = await db.Audio.findAll({
      where: {
        isDeleted: true,
        deletedAt: {
          [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    for (const audio of oldTrash) {
      if (fs.existsSync(audio.filePath)) {
        fs.unlinkSync(audio.filePath);
      }
      await audio.destroy();
    }

    return {
      expiredDeleted: deletedCount,
      oldTrashDeleted: oldTrash.length,
      totalSizeFreed: totalSize
    };
  } catch (error) {
    throw error;
  }
});

cleanupQueue.on('completed', (job, result) => {
  console.log(`Cleanup job completed:`, result);
});

module.exports = cleanupQueue;

