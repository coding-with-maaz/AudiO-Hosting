const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/create-intent', authenticate, paymentController.createPaymentIntent);
// Stripe webhook route is handled in server.js with raw body parsing
router.post('/stripe-webhook', paymentController.handleStripeWebhook);
router.post('/paypal-order', authenticate, paymentController.createPayPalOrder);

module.exports = router;

