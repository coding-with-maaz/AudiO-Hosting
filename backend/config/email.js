require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  // Use console logging in development if SMTP not configured
  transporter = {
    sendMail: async (options) => {
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
        text: options.text
      });
      return { messageId: 'dev-mode' };
    }
  };
}

module.exports = transporter;

