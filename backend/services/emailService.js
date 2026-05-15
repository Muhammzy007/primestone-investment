const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        console.log('Initializing email service...');
        console.log('SMTP_USER:', process.env.SMTP_USER);
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
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
            console.log(`✅ Email sent to ${to}:`, info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendWelcomeEmail(email, username) {
        const subject = '🎉 Welcome to PrimeStone Investment!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome ${username}!</h2>
                <p>Thank you for joining PrimeStone Investment Platform.</p>
                <p>You can start investing from as low as <strong>$500</strong>.</p>
                <p>Features:</p>
                <ul>
                    <li>✅ Up to 200% returns on investment</li>
                    <li>✅ Daily yields of 6.67%</li>
                    <li>✅ Flexible payment options</li>
                    <li>✅ Secure blockchain verification</li>
                </ul>
                <a href="${process.env.FRONTEND_URL || 'https://primestone-investment.netlify.app'}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create this account, please ignore this email.</p>
            </div>
        `;
        return this.sendEmail(email, subject, html);
    }

    async sendPasswordResetEmail(email, username, resetLink) {
        const subject = '🔐 Password Reset Request - PrimeStone';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hello ${username},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                <p style="margin-top: 20px;">Or copy this link: ${resetLink}</p>
                <p><strong>⚠️ This link will expire in 1 hour</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `;
        return this.sendEmail(email, subject, html);
    }

    async sendPaymentConfirmation(email, username, amount, investmentId) {
        const subject = '💰 Payment Confirmed - PrimeStone';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Payment Confirmed!</h2>
                <p>Hello ${username},</p>
                <p>Your payment of <strong>$${amount}</strong> has been confirmed for Investment #${investmentId}.</p>
                <p>Your investment is now active and earning daily yields.</p>
                <a href="${process.env.FRONTEND_URL || 'https://primestone-investment.netlify.app'}/investments/${investmentId}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Investment</a>
            </div>
        `;
        return this.sendEmail(email, subject, html);
    }
}

module.exports = EmailService;
