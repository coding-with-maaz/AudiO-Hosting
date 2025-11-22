const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { Op } = require('sequelize');

exports.createAffiliate = async (req, res, next) => {
  try {
    // Check if user already has affiliate account
    const existingAffiliate = await db.Affiliate.findOne({
      where: { userId: req.user.id }
    });

    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: 'Affiliate account already exists'
      });
    }

    // Generate unique affiliate code
    const affiliateCode = `AFF${req.user.id.substring(0, 8).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const affiliate = await db.Affiliate.create({
      userId: req.user.id,
      affiliateCode,
      commissionRate: config.affiliate.commissionRate,
      minPayout: config.affiliate.minPayout
    });

    res.status(201).json({
      success: true,
      message: 'Affiliate account created successfully',
      data: { affiliate }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAffiliate = async (req, res, next) => {
  try {
    const affiliate = await db.Affiliate.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate account not found'
      });
    }

    res.json({
      success: true,
      data: { affiliate }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAffiliateStats = async (req, res, next) => {
  try {
    const affiliate = await db.Affiliate.findOne({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate account not found'
      });
    }

    // Get recent transactions
    const transactions = await db.Transaction.findAll({
      where: {
        affiliateId: affiliate.id,
        status: 'completed'
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.Plan,
          as: 'plan',
          attributes: ['id', 'name', 'price']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Calculate stats
    const stats = {
      totalEarnings: parseFloat(affiliate.totalEarnings),
      pendingEarnings: parseFloat(affiliate.pendingEarnings),
      paidEarnings: parseFloat(affiliate.paidEarnings),
      totalReferrals: affiliate.totalReferrals,
      activeReferrals: affiliate.activeReferrals,
      totalClicks: affiliate.totalClicks,
      totalSignups: affiliate.totalSignups,
      conversionRate: affiliate.totalClicks > 0 
        ? ((affiliate.totalSignups / affiliate.totalClicks) * 100).toFixed(2)
        : 0,
      recentTransactions: transactions
    };

    res.json({
      success: true,
      data: { stats, affiliate }
    });
  } catch (error) {
    next(error);
  }
};

exports.requestPayout = async (req, res, next) => {
  try {
    const { amount, payoutMethod, payoutDetails } = req.body;
    const affiliate = await db.Affiliate.findOne({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate account not found'
      });
    }

    const pendingAmount = parseFloat(affiliate.pendingEarnings);

    if (amount > pendingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient pending earnings'
      });
    }

    if (amount < parseFloat(affiliate.minPayout)) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is ${affiliate.minPayout}`
      });
    }

    // Create payout transaction
    const transaction = await db.Transaction.create({
      userId: req.user.id,
      affiliateId: affiliate.id,
      type: 'payout',
      amount: -amount, // Negative for payout
      currency: 'USD',
      status: 'pending',
      paymentMethod: payoutMethod,
      description: `Payout request for affiliate ${affiliate.affiliateCode}`,
      metadata: { payoutDetails }
    });

    // Update affiliate earnings
    await affiliate.update({
      pendingEarnings: db.sequelize.literal(`pendingEarnings - ${amount}`)
    });

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

exports.trackClick = async (req, res, next) => {
  try {
    const { code } = req.params;
    const affiliate = await db.Affiliate.findOne({
      where: { affiliateCode: code, isActive: true }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Invalid affiliate code'
      });
    }

    // Increment click count
    await affiliate.increment('totalClicks');

    res.json({
      success: true,
      message: 'Click tracked',
      data: {
        affiliateCode: code,
        redirectUrl: '/register?affiliate=' + code
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin function to process affiliate commissions
exports.processCommission = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    const transaction = await db.Transaction.findByPk(transactionId);

    if (!transaction || transaction.type !== 'subscription' || transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction'
      });
    }

    // Find referring affiliate
    const affiliate = await db.Affiliate.findOne({
      where: { userId: transaction.userId }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'No affiliate found for this user'
      });
    }

    const plan = await db.Plan.findByPk(transaction.planId);
    const commissionAmount = parseFloat(plan.price) * parseFloat(affiliate.commissionRate);

    // Create commission transaction
    const commissionTransaction = await db.Transaction.create({
      userId: affiliate.userId,
      affiliateId: affiliate.id,
      type: 'affiliate_commission',
      amount: commissionAmount,
      currency: transaction.currency,
      status: 'completed',
      description: `Commission for referral subscription`,
      metadata: { originalTransactionId: transaction.id }
    });

    // Update affiliate earnings
    await affiliate.update({
      totalEarnings: db.sequelize.literal(`totalEarnings + ${commissionAmount}`),
      pendingEarnings: db.sequelize.literal(`pendingEarnings + ${commissionAmount}`)
    });

    res.json({
      success: true,
      message: 'Commission processed successfully',
      data: { commissionTransaction }
    });
  } catch (error) {
    next(error);
  }
};

