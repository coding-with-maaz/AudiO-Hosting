const db = require('../models');
const crypto = require('crypto');
const transporter = require('../config/email');
const emailTemplates = require('../utils/emailTemplates');

exports.sendVerificationEmail = async (userId) => {
  try {
    const user = await db.User.findByPk(userId);
    if (!user) return { success: false, message: 'User not found' };

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in user metadata or create separate table
    await user.update({
      metadata: {
        ...(user.metadata || {}),
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt
      }
    });

    const template = emailTemplates.verification(user, token);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@audiohosting.com',
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token required'
      });
    }

    const user = await db.User.findOne({
      where: {
        'metadata.emailVerificationToken': token,
        isEmailVerified: false
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const expiresAt = user.metadata?.emailVerificationExpires;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token expired'
      });
    }

    await user.update({
      isEmailVerified: true,
      metadata: {
        ...user.metadata,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.sendPasswordResetEmail = async (email) => {
  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({
      metadata: {
        ...(user.metadata || {}),
        passwordResetToken: token,
        passwordResetExpires: expiresAt
      }
    });

    const template = emailTemplates.passwordReset(user, token);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@audiohosting.com',
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    await exports.sendPasswordResetEmail(email);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await db.User.findOne({
      where: {
        'metadata.passwordResetToken': token
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const expiresAt = user.metadata?.passwordResetExpires;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token expired'
      });
    }

    await user.update({
      password: newPassword,
      metadata: {
        ...user.metadata,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    const result = await exports.sendVerificationEmail(req.user.id);

    if (result.success) {
      res.json({
        success: true,
        message: 'Verification email sent'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
  } catch (error) {
    next(error);
  }
};

