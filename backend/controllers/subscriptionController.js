const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.subscribe = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await db.Plan.findByPk(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Cancel existing active subscriptions
    await db.Subscription.update(
      { status: 'cancelled', cancelledAt: new Date() },
      {
        where: {
          userId: req.user.id,
          status: 'active'
        }
      }
    );

    // Calculate end date
    let endDate = null;
    if (plan.billingPeriod === 'monthly') {
      endDate = moment().add(1, 'month').toDate();
    } else if (plan.billingPeriod === 'yearly') {
      endDate = moment().add(1, 'year').toDate();
    }
    // lifetime plans have null endDate

    // Create subscription
    const subscription = await db.Subscription.create({
      userId: req.user.id,
      planId: plan.id,
      status: 'pending',
      startDate: new Date(),
      endDate: endDate,
      autoRenew: true
    });

    // Create transaction
    const transaction = await db.Transaction.create({
      userId: req.user.id,
      planId: plan.id,
      type: 'subscription',
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      description: `Subscription to ${plan.name}`
    });

    // Update user storage limit
    await db.User.update(
      { storageLimit: plan.storageLimit },
      { where: { id: req.user.id } }
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription, transaction }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await db.Subscription.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.Plan,
          as: 'plan'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { subscriptions }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await db.Subscription.findOne({
      where: {
        id,
        userId: req.user.id,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found'
      });
    }

    await subscription.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      autoRenew: false
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.completePayment = async (req, res, next) => {
  try {
    const { transactionId, paymentId, paymentMethod } = req.body;

    const transaction = await db.Transaction.findOne({
      where: {
        id: transactionId,
        userId: req.user.id,
        status: 'pending'
      },
      include: [{ model: db.Subscription, as: 'subscription' }]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction
    await transaction.update({
      status: 'completed',
      paymentId,
      paymentMethod: paymentMethod || 'other'
    });

    // Activate subscription
    if (transaction.type === 'subscription') {
      const subscription = await db.Subscription.findOne({
        where: {
          userId: req.user.id,
          planId: transaction.planId,
          status: 'pending'
        }
      });

      if (subscription) {
        await subscription.update({ status: 'active' });
      }
    }

    res.json({
      success: true,
      message: 'Payment completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

