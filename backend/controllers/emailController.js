const db = require('../models');
const crypto = require('crypto');
const transporter = require('../config/email');
const emailTemplates = require('../utils/emailTemplates');

exports.sendVerificationEmail = async (userId) => {
  try {
    const user = await db.User.findByPk(userId);
    if (!user) return { success: false, message: 'User not found' };

    // Generate 6-digit OTP PIN
    const otpPin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get current metadata (handle both JSON string and object)
    let currentMetadata = {};
    if (user.metadata) {
      if (typeof user.metadata === 'string') {
        try {
          currentMetadata = JSON.parse(user.metadata);
        } catch (e) {
          currentMetadata = {};
        }
      } else {
        currentMetadata = user.metadata;
      }
    }

    // Store OTP PIN in user metadata
    const updatedMetadata = {
      ...currentMetadata,
      emailVerificationOTP: otpPin,
      emailVerificationExpires: expiresAt.toISOString()
    };

    await user.update({
      metadata: updatedMetadata
    });

    // Reload user to ensure metadata is saved
    await user.reload();

    const template = emailTemplates.verification(user, otpPin);

    await transporter.sendMail({
      from: process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || 'noreply@audiohub.com',
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    return { success: true, otpPin }; // Return OTP for testing (remove in production)
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP PIN code is required'
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await db.User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Parse metadata (handle both JSON string and object)
    let metadata = {};
    if (user.metadata) {
      if (typeof user.metadata === 'string') {
        try {
          metadata = JSON.parse(user.metadata);
        } catch (e) {
          console.error('Error parsing metadata:', e);
          metadata = {};
        }
      } else {
        metadata = user.metadata;
      }
    }

    console.log('User metadata:', JSON.stringify(metadata, null, 2));
    console.log('Looking for OTP:', otp);

    const storedOTP = metadata?.emailVerificationOTP;
    const expiresAt = metadata?.emailVerificationExpires;

    console.log('Stored OTP:', storedOTP);
    console.log('Expires at:', expiresAt);

    if (!storedOTP) {
      console.log('No OTP found in metadata');
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.'
      });
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired. Please request a new one.'
      });
    }

    if (storedOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Remove OTP from metadata
    const updatedMetadata = { ...metadata };
    delete updatedMetadata.emailVerificationOTP;
    delete updatedMetadata.emailVerificationExpires;

    await user.update({
      isEmailVerified: true,
      metadata: updatedMetadata
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
      from: process.env.SMTP_FROM || 'noreply@audiohub.com',
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

