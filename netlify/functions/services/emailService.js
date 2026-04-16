const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

class EmailService {
    constructor() {
        this.user = process.env.SMTP_USER;
        this.pass = process.env.SMTP_PASS;
        
        console.log('📧 Email service initializing...');
        console.log('📧 SMTP_USER:', this.user);
        
        this.createTransporter();
    }

    createTransporter() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: this.user,
                pass: this.pass
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            }
        });
    }

    async sendEmail(to, subject, html) {
        const startTime = Date.now();

        try {
            const mailOptions = {
                from: `"PrimeStone Investment" <${this.user}>`,
                to,
                subject,
                html
            };

            console.log(`📧 Sending email to ${to}...`);

            await this.transporter.verify();
            
            const info = await this.transporter.sendMail(mailOptions);
            const duration = Date.now() - startTime;

            console.log(`✅ Email sent in ${duration}ms: ${info.messageId}`);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ Email failed after ${duration}ms:`, error.message);
            
            console.log('🔄 Recreating transporter and retrying...');
            this.createTransporter();
            
            try {
                await this.transporter.verify();
                const mailOptions = {
                    from: `"PrimeStone Investment" <${this.user}>`,
                    to,
                    subject,
                    html
                };
                const info = await this.transporter.sendMail(mailOptions);
                console.log(`✅ Email sent on retry: ${info.messageId}`);
                return { success: true, messageId: info.messageId };
            } catch (retryError) {
                console.error('❌ Retry also failed:', retryError.message);
                return {
                    success: false,
                    error: 'Failed to send email',
                    code: error.code
                };
            }
        }
    }

    // Welcome email - UPDATED to $500 minimum
    async sendWelcomeEmail(userEmail, username) {
        const subject = '🎉 Welcome to PrimeStone Investment!';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">PrimeStone</h1>
                        <p style="color: #e0e0e0; margin: 10px 0 0 0;">Investment Platform</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #333333; margin: 0 0 20px 0;">Welcome ${username}!</h2>
                        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">Thank you for joining PrimeStone Investment platform. We're excited to have you on board!</p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 10px 0; color: #333333;">✓ Start investing from as low as $500</p>
                            <p style="margin: 10px 0; color: #333333;">✓ Earn daily yields on your investments</p>
                            <p style="margin: 10px 0; color: #333333;">✓ Track your portfolio in real-time</p>
                            <p style="margin: 10px 0; color: #333333;">✓ Flexible payment options</p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Get Started</a>
                        </div>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="color: #999999; font-size: 12px; margin: 0;">This email was sent to ${userEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return this.sendEmail(userEmail, subject, html);
    }

    // Password reset email
    async sendPasswordResetEmail(userEmail, username, resetLink) {
        const subject = '🔐 Password Reset Request - PrimeStone Investment';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">PrimeStone</h1>
                        <p style="color: #e0e0e0; margin: 10px 0 0 0;">Password Reset</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #333333; margin: 0 0 20px 0;">Hello ${username},</h2>
                        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">Click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #ef4444; font-size: 14px;">⚠️ This link will expire in 1 hour</p>
                        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(userEmail, subject, html);
    }

    // Payment confirmation email
    async sendPaymentConfirmation(userEmail, username, amount, investmentId) {
        const subject = '✅ Payment Confirmed - PrimeStone Investment';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">PrimeStone</h1>
                        <p style="color: #e0e0e0; margin: 10px 0 0 0;">Payment Confirmation</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #333333; margin: 0 0 20px 0;">Hello ${username},</h2>
                        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">Your payment has been confirmed successfully!</p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 10px 0; font-size: 18px;"><strong>Amount:</strong> <span style="color: #28a745;">$${amount}</span></p>
                            <p style="margin: 10px 0;"><strong>Investment ID:</strong> #${investmentId}</p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/investments/${investmentId}" style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); color: #333333; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Investment</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(userEmail, subject, html);
    }
}

module.exports = EmailService;
