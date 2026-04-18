const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
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

    async sendWelcomeEmail(email, username) {
        const subject = 'Welcome to PrimeStone Investment!';
        const html = `<h2>Welcome ${username}!</h2><p>Thank you for joining PrimeStone Investment Platform.</p><p>You can start investing from as low as $500.</p><a href="${process.env.FRONTEND_URL}/login">Login Here</a>`;
        
        try {
            await this.transporter.sendMail({
                from: `"PrimeStone" <${process.env.SMTP_USER}>`,
                to: email,
                subject,
                html
            });
            console.log(`Welcome email sent to ${email}`);
            return true;
        } catch (error) {
            console.error('Email error:', error);
            return false;
        }
    }

    async sendPaymentConfirmation(email, username, amount, investmentId) {
        const subject = 'Payment Received - PrimeStone';
        const html = `<h2>Payment Confirmed!</h2><p>Hello ${username},</p><p>Your payment of $${amount} has been confirmed for Investment #${investmentId}.</p>`;
        
        try {
            await this.transporter.sendMail({
                from: `"PrimeStone" <${process.env.SMTP_USER}>`,
                to: email,
                subject,
                html
            });
            return true;
        } catch (error) {
            console.error('Payment email error:', error);
            return false;
        }
    }
}

module.exports = EmailService;
