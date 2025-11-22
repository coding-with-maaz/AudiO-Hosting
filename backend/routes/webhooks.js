const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, webhookController.createWebhook);
router.get('/', authenticate, webhookController.getWebhooks);
router.delete('/:id', authenticate, webhookController.deleteWebhook);

module.exports = router;

