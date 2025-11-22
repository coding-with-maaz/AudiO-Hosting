const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/audios', searchController.searchAudios);
router.get('/filters', searchController.getFilters);

module.exports = router;

