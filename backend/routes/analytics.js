const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.get('/audio/:audioId', authenticate, analyticsController.getAudioAnalytics);
router.get('/my', authenticate, analyticsController.getUserAnalytics);

module.exports = router;

