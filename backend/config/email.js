require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter = null;

// Check for email configuration (support both SMTP_* and MAIL_* env vars)
const mailHost = process.env.MAIL_HOST || process.env.SMTP_HOST;
const mailPort = process.env.MAIL_PORT || process.env.SMTP_PORT;
const mailUser = process.env.MAIL_USERNAME || process.env.SMTP_USER;
const mailPass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
const mailSecure = process.env.MAIL_ENCRYPTION === 'tls' ? false : (process.env.MAIL_ENCRYPTION === 'ssl' || process.env.SMTP_SECURE === 'true');

if (mailHost && mailUser && mailPass) {
  transporter = nodemailer.createTransport({
    host: mailHost,
    port: parseInt(mailPort) || 587,
    secure: mailSecure,
    auth: {
      user: mailUser,
      pass: mailPass
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

