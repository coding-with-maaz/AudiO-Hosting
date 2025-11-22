const express = require('express');
const router = express.Router();
const bulkController = require('../controllers/bulkController');
const { authenticate } = require('../middleware/auth');
const { multiple } = require('../middleware/upload');

router.post('/upload', authenticate, multiple, bulkController.bulkUpload);
router.post('/delete', authenticate, bulkController.bulkDelete);
router.post('/move', authenticate, bulkController.bulkMove);
router.post('/update', authenticate, bulkController.bulkUpdate);

module.exports = router;

