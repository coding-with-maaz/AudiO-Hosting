const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/audios', adminController.getAllAudios);
router.delete('/audios/:id', adminController.deleteAudio);
router.get('/users/:userId/bandwidth', adminController.getUserBandwidth);

module.exports = router;

