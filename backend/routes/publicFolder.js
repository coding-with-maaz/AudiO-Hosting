const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');

// Public route for shared folders
router.get('/:id', folderController.getSharedFolder);

module.exports = router;

