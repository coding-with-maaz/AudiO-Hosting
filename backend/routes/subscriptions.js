const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

router.post('/subscribe', authenticate, subscriptionController.subscribe);
router.get('/my', authenticate, subscriptionController.getMySubscriptions);
router.put('/:id/cancel', authenticate, subscriptionController.cancelSubscription);
router.post('/complete-payment', authenticate, subscriptionController.completePayment);

module.exports = router;

