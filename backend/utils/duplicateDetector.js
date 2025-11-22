const db = require('../models');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculate file hash for duplicate detection
 */
async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Check for duplicate files
 */
async function checkDuplicate(userId, filePath) {
  try {
    const fileHash = await calculateFileHash(filePath);
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Check for existing file with same hash and size
    const existing = await db.Audio.findOne({
      where: {
        userId,
        fileSize,
        'metadata.fileHash': fileHash,
        isDeleted: false
      }
    });

    return {
      isDuplicate: !!existing,
      duplicateId: existing?.id || null,
      fileHash
    };
  } catch (error) {
    console.error('Duplicate check error:', error);
    return {
      isDuplicate: false,
      duplicateId: null,
      fileHash: null
    };
  }
}

/**
 * Store file hash in metadata
 */
async function storeFileHash(audioId, fileHash) {
  try {
    const audio = await db.Audio.findByPk(audioId);
    if (audio) {
      await audio.update({
        metadata: {
          ...audio.metadata,
          fileHash
        }
      });
    }
  } catch (error) {
    console.error('Store hash error:', error);
  }
}

module.exports = {
  calculateFileHash,
  checkDuplicate,
  storeFileHash
};

