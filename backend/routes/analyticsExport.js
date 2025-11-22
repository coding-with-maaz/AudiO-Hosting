const express = require('express');
const router = express.Router();
const analyticsExportController = require('../controllers/analyticsExportController');
const { authenticate } = require('../middleware/auth');

router.get('/export/csv', authenticate, analyticsExportController.exportAnalyticsCSV);
router.get('/export/pdf', authenticate, analyticsExportController.exportAnalyticsPDF);

module.exports = router;

