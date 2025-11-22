const db = require('../models');
const fs = require('fs');
const path = require('path');
const { encodingQueue } = require('../config/queue');

// Note: This requires ffmpeg to be installed on the server
// For production, consider using a queue system like Bull or BullMQ

exports.encodeAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format, bitrate, quality } = req.body;

    const audio = await db.Audio.findOne({
      where: { id, userId: req.user.id }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    if (!fs.existsSync(audio.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    // Default encoding options
    const targetFormat = format || 'mp3';
    const targetBitrate = bitrate || '192k';
    const targetQuality = quality || 'high';

    // Validate format
    const allowedFormats = ['mp3', 'aac', 'ogg', 'wav'];
    if (!allowedFormats.includes(targetFormat)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported format. Supported: mp3, aac, ogg, wav'
      });
    }

    // Add job to queue
    if (process.env.REDIS_HOST) {
      const job = await encodingQueue.add('encode-audio', {
        audioId: audio.id,
        format: targetFormat,
        bitrate: targetBitrate,
        quality: targetQuality
      });

      res.json({
        success: true,
        message: 'Encoding job queued',
        data: {
          jobId: job.id,
          status: 'queued',
          audioId: audio.id
        }
      });
    } else {
      // Fallback to synchronous encoding if Redis not available
      return res.status(503).json({
        success: false,
        message: 'Queue system not available. Please configure Redis.'
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getEncodingFormats = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        formats: [
          {
            code: 'mp3',
            name: 'MP3',
            description: 'MPEG Audio Layer III',
            defaultBitrate: '192k',
            supportedBitrates: ['128k', '192k', '256k', '320k']
          },
          {
            code: 'aac',
            name: 'AAC',
            description: 'Advanced Audio Coding',
            defaultBitrate: '192k',
            supportedBitrates: ['128k', '192k', '256k', '320k']
          },
          {
            code: 'ogg',
            name: 'OGG Vorbis',
            description: 'Ogg Vorbis',
            defaultBitrate: null,
            quality: ['low', 'medium', 'high']
          },
          {
            code: 'wav',
            name: 'WAV',
            description: 'Waveform Audio File Format',
            defaultBitrate: null,
            note: 'Lossless format, larger file size'
          }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.extractMetadata = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audio = await db.Audio.findOne({
      where: { id, userId: req.user.id }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found'
      });
    }

    if (!fs.existsSync(audio.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }

    try {
      // Use ffprobe to extract metadata
      const { stdout } = await execPromise(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${audio.filePath}"`
      );

      const metadata = JSON.parse(stdout);
      
      // Extract useful information
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      const formatInfo = metadata.format;

      const extractedMetadata = {
        duration: Math.floor(parseFloat(formatInfo.duration || 0)),
        bitrate: parseInt(formatInfo.bit_rate || 0),
        codec: audioStream?.codec_name || 'unknown',
        sampleRate: parseInt(audioStream?.sample_rate || 0),
        channels: parseInt(audioStream?.channels || 0),
        format: formatInfo.format_name,
        size: parseInt(formatInfo.size || 0),
        tags: formatInfo.tags || {}
      };

      // Update audio record with extracted metadata
      await audio.update({
        duration: extractedMetadata.duration,
        metadata: {
          ...audio.metadata,
          ...extractedMetadata
        }
      });

      res.json({
        success: true,
        message: 'Metadata extracted successfully',
        data: {
          audio,
          metadata: extractedMetadata
        }
      });
    } catch (error) {
      if (error.message.includes('ffprobe')) {
        return res.status(500).json({
          success: false,
          message: 'Metadata extraction failed. Please ensure ffmpeg/ffprobe is installed.',
          error: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

