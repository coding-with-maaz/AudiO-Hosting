const config = require('../config/config');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const templates = {
  verification: (user, token) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Audio Hosting Platform!</h2>
        <p>Hi ${user.username},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${baseUrl}/api/auth/verify-email?token=${token}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy this link: ${baseUrl}/api/auth/verify-email?token=${token}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
    text: `Welcome to Audio Hosting Platform!\n\nPlease verify your email: ${baseUrl}/api/auth/verify-email?token=${token}`
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
    subject: 'Welcome to Audio Hosting Platform!',
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

