const db = require('../models');

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await db.Plan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['price', 'ASC']]
    });

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await db.Plan.findByPk(id);

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await db.Plan.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await db.Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await plan.update(req.body);

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await db.Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await plan.update({ isActive: false });

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

