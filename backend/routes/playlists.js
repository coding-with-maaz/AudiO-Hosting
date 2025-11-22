const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, playlistController.createPlaylist);
router.get('/', authenticate, playlistController.getPlaylists);
router.get('/public', playlistController.getPlaylists); // Public playlists
router.get('/:id', playlistController.getPlaylist);
router.put('/:id', authenticate, playlistController.updatePlaylist);
router.delete('/:id', authenticate, playlistController.deletePlaylist);
router.post('/:id/audios', authenticate, playlistController.addToPlaylist);
router.delete('/:id/audios/:audioId', authenticate, playlistController.removeFromPlaylist);
router.put('/:id/order', authenticate, playlistController.updatePlaylistOrder);

module.exports = router;

