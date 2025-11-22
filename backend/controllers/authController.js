const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/config');
const emailController = require('./emailController');

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await db.User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Check for affiliate code
    const affiliateCode = req.query.affiliate || req.body.affiliateCode;
    let affiliateId = null;

    if (affiliateCode) {
      const affiliate = await db.Affiliate.findOne({
        where: { affiliateCode, isActive: true }
      });
      if (affiliate) {
        affiliateId = affiliate.id;
        // Update affiliate stats
        await affiliate.increment('totalClicks');
        await affiliate.increment('totalSignups');
        await db.Affiliate.update(
          { activeReferrals: db.sequelize.literal('activeReferrals + 1') },
          { where: { id: affiliate.id } }
        );
      }
    }

    // Create user
    const user = await db.User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Create affiliate record if user registered with affiliate code
    if (affiliateId) {
      await db.Affiliate.create({
        userId: user.id,
        affiliateCode: `AFF${user.id.substring(0, 8).toUpperCase()}`,
        commissionRate: config.affiliate.commissionRate,
        minPayout: config.affiliate.minPayout
      });
    }

    const token = generateToken(user.id);

    // Send verification email
    await emailController.sendVerificationEmail(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await db.User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      include: [
        {
          model: db.Subscription,
          as: 'subscriptions',
          where: { status: 'active' },
          required: false,
          include: [{ model: db.Plan, as: 'plan' }]
        },
        {
          model: db.Affiliate,
          as: 'affiliate',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, avatar } = req.body;
    const user = await db.User.findByPk(req.user.id);

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      avatar: avatar || user.avatar
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await db.User.findByPk(req.user.id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

