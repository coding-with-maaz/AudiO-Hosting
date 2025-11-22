const express = require('express');
const router = express.Router();
const encodingController = require('../controllers/encodingController');
const { authenticate } = require('../middleware/auth');

router.get('/formats', authenticate, encodingController.getEncodingFormats);
router.post('/encode/:id', authenticate, encodingController.encodeAudio);
router.post('/extract-metadata/:id', authenticate, encodingController.extractMetadata);

module.exports = router;

