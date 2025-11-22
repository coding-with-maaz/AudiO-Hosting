const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { authenticate } = require('../middleware/auth');

// Favorites
router.post('/favorites/:audioId', authenticate, interactionController.addFavorite);
router.delete('/favorites/:audioId', authenticate, interactionController.removeFavorite);
router.get('/favorites', authenticate, interactionController.getFavorites);

// Comments
router.post('/comments/:audioId', authenticate, interactionController.addComment);
router.get('/comments/:audioId', interactionController.getComments);
router.put('/comments/:id', authenticate, interactionController.updateComment);
router.delete('/comments/:id', authenticate, interactionController.deleteComment);

// Ratings
router.post('/ratings/:audioId', authenticate, interactionController.addRating);
router.get('/ratings/:audioId', interactionController.getRatings);

module.exports = router;

