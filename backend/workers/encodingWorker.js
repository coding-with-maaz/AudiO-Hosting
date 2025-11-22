const { encodingQueue } = require('../config/queue');
const db = require('../models');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

encodingQueue.process('encode-audio', async (job) => {
  const { audioId, format, bitrate, quality } = job.data;
  
  try {
    const audio = await db.Audio.findByPk(audioId);
    if (!audio || !fs.existsSync(audio.filePath)) {
      throw new Error('Audio file not found');
    }

    const outputDir = path.dirname(audio.filePath);
    const outputFilename = `${path.parse(audio.filename).name}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);

    let ffmpegCommand = `ffmpeg -i "${audio.filePath}"`;
    
    if (format === 'mp3') {
      ffmpegCommand += ` -codec:a libmp3lame -b:a ${bitrate}`;
    } else if (format === 'aac') {
      ffmpegCommand += ` -codec:a aac -b:a ${bitrate}`;
    } else if (format === 'ogg') {
      ffmpegCommand += ` -codec:a libvorbis -q:a ${quality === 'high' ? '5' : '3'}`;
    } else if (format === 'wav') {
      ffmpegCommand += ` -codec:a pcm_s16le`;
    }

    ffmpegCommand += ` "${outputPath}"`;

    await execPromise(ffmpegCommand);

    const stats = fs.statSync(outputPath);
    const outputFileSize = stats.size;

    const user = await db.User.findByPk(audio.userId);
    if (user.storageUsed + outputFileSize > user.storageLimit) {
      fs.unlinkSync(outputPath);
      throw new Error('Storage limit exceeded');
    }

    const encodedAudio = await db.Audio.create({
      userId: audio.userId,
      folderId: audio.folderId,
      title: `${audio.title} (${format.toUpperCase()})`,
      description: `Encoded version of ${audio.title}`,
      filename: outputFilename,
      originalFilename: `${path.parse(audio.originalFilename).name}.${format}`,
      filePath: outputPath,
      fileSize: outputFileSize,
      mimeType: `audio/${format}`,
      isPublic: audio.isPublic,
      tags: audio.tags,
      metadata: {
        ...audio.metadata,
        encodedFrom: audio.id,
        format,
        bitrate,
        quality
      }
    });

    await user.increment('storageUsed', { by: outputFileSize });

    return {
      success: true,
      audioId: encodedAudio.id,
      originalId: audio.id
    };
  } catch (error) {
    throw error;
  }
});

encodingQueue.on('completed', (job, result) => {
  console.log(`Encoding job ${job.id} completed:`, result);
});

encodingQueue.on('failed', (job, err) => {
  console.error(`Encoding job ${job.id} failed:`, err);
});

module.exports = encodingQueue;

