const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        console.log('Initializing email service...');
        console.log('SMTP_USER:', process.env.SMTP_USER);
        
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: `"PrimeStone Investment" <${process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                html: html
            });
            console.log(`Email sent to ${to}:`, info.messageId);
            return { success: true };
        } catch (error) {
            console.error('Email error:', error);
            return { success: false, error: error.message };
        }
    }

    async sendWelcomeEmail(email, username) {
        const subject = 'Welcome to PrimeStone Investment!';
        const html = `
            <h2>Welcome ${username}!</h2>
            <p>Thank you for joining PrimeStone Investment Platform.</p>
            <p>You can start investing from as low as $500.</p>
            <a href="${process.env.FRONTEND_URL || 'https://primestone-investment.netlify.app'}/login">Login Here</a>
        `;
        return this.sendEmail(email, subject, html);
    }

    async sendPasswordResetEmail(email, username, resetLink) {
        const subject = 'Password Reset Request';
        const html = `
            <h2>Password Reset</h2>
            <p>Hello ${username},</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
        `;
        return this.sendEmail(email, subject, html);
    }

    async sendPaymentConfirmation(email, username, amount, investmentId) {
        const subject = 'Payment Received - PrimeStone';
        const html = `
            <h2>Payment Confirmed!</h2>
            <p>Hello ${username},</p>
            <p>Your payment of $${amount} has been confirmed for Investment #${investmentId}.</p>
        `;
        return this.sendEmail(email, subject, html);
    }
}

module.exports = EmailService;
