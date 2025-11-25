const config = require('../config/config');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const templates = {
  verification: (user, otpPin) => ({
    subject: 'Verify Your Email Address - OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to AUDioHub!</h2>
        <p>Hi ${user.username},</p>
        <p>Please verify your email address using the OTP code below:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="font-size: 36px; letter-spacing: 8px; color: #007bff; margin: 0;">${otpPin}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">Enter this code in the verification form to complete your email verification.</p>
        <p style="color: #d32f2f; font-size: 14px; font-weight: bold;">⚠️ This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
    text: `Welcome to AUDioHub!\n\nHi ${user.username},\n\nPlease verify your email address using this OTP code: ${otpPin}\n\nThis code will expire in 10 minutes.\n\nIf you didn't create an account, please ignore this email.`
  }),

  passwordReset: (user, token) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.username},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${baseUrl}/api/auth/reset-password?token=${token}" 
           style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy this link: ${baseUrl}/api/auth/reset-password?token=${token}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    text: `Password Reset Request\n\nReset your password: ${baseUrl}/api/auth/reset-password?token=${token}`
  }),

  welcome: (user) => ({
    subject: 'Welcome to AUDioHub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome ${user.username}!</h2>
        <p>Thank you for joining our audio hosting platform.</p>
        <p>You can now:</p>
        <ul>
          <li>Upload and manage your audio files</li>
          <li>Create folders to organize your content</li>
          <li>Share your audio with direct links</li>
          <li>Embed audio players on your website</li>
        </ul>
        <p>Get started by uploading your first audio file!</p>
      </div>
    `,
    text: `Welcome ${user.username}!\n\nThank you for joining our audio hosting platform.`
  })
};

module.exports = templates;

