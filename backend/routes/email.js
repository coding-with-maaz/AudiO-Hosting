const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');

router.get('/verify-email', emailController.verifyEmail);
router.post('/request-password-reset', emailController.requestPasswordReset);
router.post('/reset-password', emailController.resetPassword);
router.post('/resend-verification', authenticate, emailController.resendVerification);

module.exports = router;

