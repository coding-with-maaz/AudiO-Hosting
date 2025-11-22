const db = require('../models');
const { Op } = require('sequelize');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.exportAnalyticsCSV = async (req, res, next) => {
  try {
    const { audioId, startDate, endDate } = req.query;

    const where = {};
    if (audioId) {
      where.audioId = audioId;
      // Verify ownership
      const audio = await db.Audio.findOne({
        where: { id: audioId, userId: req.user.id }
      });
      if (!audio) {
        return res.status(404).json({
          success: false,
          message: 'Audio not found'
        });
      }
    } else {
      where.userId = req.user.id;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const analytics = await db.Analytics.findAll({
      where,
      include: [
        {
          model: db.Audio,
          as: 'audio',
          attributes: ['id', 'title'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const csvData = analytics.map(a => ({
      Date: a.createdAt.toISOString(),
      Event: a.eventType,
      'Audio Title': a.audio?.title || 'N/A',
      'IP Address': a.ipAddress || 'N/A',
      Country: a.country || 'N/A',
      Device: a.device || 'N/A',
      Browser: a.browser || 'N/A',
      OS: a.os || 'N/A'
    }));

    const tempPath = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }

    const filename = `analytics_${Date.now()}.csv`;
    const filepath = path.join(tempPath, filename);

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'Date', title: 'Date' },
        { id: 'Event', title: 'Event Type' },
        { id: 'Audio Title', title: 'Audio Title' },
        { id: 'IP Address', title: 'IP Address' },
        { id: 'Country', title: 'Country' },
        { id: 'Device', title: 'Device' },
        { id: 'Browser', title: 'Browser' },
        { id: 'OS', title: 'OS' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up temp file
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 5000);
    });
  } catch (error) {
    next(error);
  }
};

exports.exportAnalyticsPDF = async (req, res, next) => {
  try {
    const { audioId, startDate, endDate } = req.query;

    const where = {};
    if (audioId) {
      where.audioId = audioId;
      const audio = await db.Audio.findOne({
        where: { id: audioId, userId: req.user.id }
      });
      if (!audio) {
        return res.status(404).json({
          success: false,
          message: 'Audio not found'
        });
      }
    } else {
      where.userId = req.user.id;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const analytics = await db.Analytics.findAll({
      where,
      include: [
        {
          model: db.Audio,
          as: 'audio',
          attributes: ['id', 'title'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    const tempPath = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }

    const filename = `analytics_${Date.now()}.pdf`;
    const filepath = path.join(tempPath, filename);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filepath));

    doc.fontSize(20).text('Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Summary stats
    const stats = {
      total: analytics.length,
      views: analytics.filter(a => a.eventType === 'view').length,
      downloads: analytics.filter(a => a.eventType === 'download').length,
      plays: analytics.filter(a => a.eventType === 'play').length
    };

    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Events: ${stats.total}`);
    doc.text(`Views: ${stats.views}`);
    doc.text(`Downloads: ${stats.downloads}`);
    doc.text(`Plays: ${stats.plays}`);
    doc.moveDown();

    // Event details
    doc.fontSize(14).text('Event Details', { underline: true });
    doc.moveDown();

    analytics.slice(0, 100).forEach((a, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. ${a.eventType.toUpperCase()} - ${a.audio?.title || 'N/A'}`);
      doc.text(`   Date: ${a.createdAt.toLocaleString()} | Country: ${a.country || 'N/A'} | Device: ${a.device || 'N/A'}`);
      doc.moveDown(0.5);
    });

    doc.end();

    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 5000);
    });
  } catch (error) {
    next(error);
  }
};

