const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route for tracking clicks
router.get('/track/:code', affiliateController.trackClick);

// User routes
router.post('/create', authenticate, affiliateController.createAffiliate);
router.get('/my', authenticate, affiliateController.getMyAffiliate);
router.get('/my/stats', authenticate, affiliateController.getAffiliateStats);
router.post('/payout', authenticate, affiliateController.requestPayout);

// Admin route
router.post('/process-commission', authenticate, authorize('admin'), affiliateController.processCommission);

module.exports = router;

