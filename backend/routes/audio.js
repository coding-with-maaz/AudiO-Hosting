const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { authenticate, authorize } = require('../middleware/auth');
const { single } = require('../middleware/upload');

// Public routes
router.get('/', audioController.getAudios);
router.get('/:id', audioController.getAudio);
router.get('/:id/download', audioController.downloadAudio);

// Protected routes
router.post('/upload', authenticate, single, audioController.uploadAudio);
router.get('/my/list', authenticate, audioController.getMyAudios);
router.put('/:id', authenticate, audioController.updateAudio);
router.put('/:id/rename', authenticate, audioController.renameAudio);
router.delete('/:id', authenticate, audioController.deleteAudio);

module.exports = router;

