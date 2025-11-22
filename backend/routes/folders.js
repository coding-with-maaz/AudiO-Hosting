const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.post('/', authenticate, folderController.createFolder);
router.get('/', authenticate, folderController.getFolders);
router.get('/:id', authenticate, folderController.getFolder);
router.put('/:id', authenticate, folderController.updateFolder);
router.put('/:id/rename', authenticate, folderController.renameFolder);
router.delete('/:id', authenticate, folderController.deleteFolder);
router.post('/:id/enable-sharing', authenticate, folderController.enableFolderSharing);
router.post('/:id/disable-sharing', authenticate, folderController.disableFolderSharing);
router.get('/:id/export', authenticate, folderController.exportFolder);

module.exports = router;

