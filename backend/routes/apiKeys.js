const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, apiKeyController.createApiKey);
router.get('/', authenticate, apiKeyController.getApiKeys);
router.put('/:id', authenticate, apiKeyController.updateApiKey);
router.delete('/:id', authenticate, apiKeyController.deleteApiKey);

module.exports = router;

