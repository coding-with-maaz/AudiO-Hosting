const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', planController.getPlans);
router.get('/:id', planController.getPlan);

// Admin routes
router.post('/', authenticate, authorize('admin'), planController.createPlan);
router.put('/:id', authenticate, authorize('admin'), planController.updatePlan);
router.delete('/:id', authenticate, authorize('admin'), planController.deletePlan);

module.exports = router;

