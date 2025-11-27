const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route - submit contact message
router.post('/', contactController.submitContact);

// Authenticated routes - user's own messages
router.get('/my', authenticate, contactController.getMyContacts);
router.get('/my/:id', authenticate, contactController.getContact);

// Admin routes
router.get('/', authenticate, authorize('admin'), contactController.getAllContacts);
router.get('/stats', authenticate, authorize('admin'), contactController.getSupportStats);
router.get('/:id', authenticate, authorize('admin'), contactController.getContact);
router.put('/:id', authenticate, authorize('admin'), contactController.updateContact);
router.delete('/:id', authenticate, authorize('admin'), contactController.deleteContact);

module.exports = router;

