const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { authenticate } = require('../middleware/auth');

// Public routes for sharing
router.get('/d/:id', shareController.serveDirectDownload);
router.get('/e/:id', shareController.serveEmbed);

// Protected route to get share links
router.get('/links/:id', authenticate, shareController.getDirectLink);

module.exports = router;

