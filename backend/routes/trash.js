const express = require('express');
const router = express.Router();
const trashController = require('../controllers/trashController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, trashController.getTrash);
router.post('/restore/:id', authenticate, trashController.restoreAudio);
router.delete('/empty', authenticate, trashController.emptyTrash);

module.exports = router;

