const express = require('express');
const router = express.Router();
const remoteUploadController = require('../controllers/remoteUploadController');
const { authenticate } = require('../middleware/auth');

router.post('/from-url', authenticate, remoteUploadController.uploadFromUrl);

module.exports = router;

