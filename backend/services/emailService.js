const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      await this.transporter.sendMail({ from: `"PrimeStone" <${process.env.SMTP_USER}>`, to, subject, html });
      console.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Email error:', error.message);
      return false;
    }
  }

  async sendWelcomeEmail(email, username) {
    return this.sendEmail(email, 'Welcome to PrimeStone!', `<h2>Welcome ${username}!</h2><p>Thank you for joining PrimeStone.</p><p>Minimum investment: $500</p><a href="${process.env.FRONTEND_URL}/login">Login</a>`);
  }

  async sendPasswordResetEmail(email, username, resetLink) {
    return this.sendEmail(email, 'Password Reset', `<h2>Reset Password</h2><p>Hello ${username},</p><a href="${resetLink}">Reset Password</a><p>Expires in 1 hour</p>`);
  }
}

module.exports = EmailService;
