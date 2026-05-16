require('dotenv').config();

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.SENDER_EMAIL || 'primestoneinvestmentplatform@gmail.com';
    this.senderName = process.env.SENDER_NAME || 'PrimeStone Investment';
  }

  async sendEmail(to, subject, htmlContent) {
    if (!this.apiKey) {
      console.error('❌ Missing Brevo API key');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: htmlContent
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Brevo error:', result);
        return { success: false, error: result.message };
      }
      
      console.log(`✅ Email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, username) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome ${username}!</h2>
        <p>Thank you for joining PrimeStone Investment Platform.</p>
        <p>You can start investing from as low as <strong>$500</strong>.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
        <p style="margin-top: 20px;">Start your investment journey today!</p>
      </div>
    `;
    return this.sendEmail(email, '🎉 Welcome to PrimeStone Investment!', html);
  }

  async sendPasswordResetEmail(email, username, resetLink) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Click the button below:</p>
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p><strong>⚠️ This link expires in 1 hour</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    return this.sendEmail(email, '🔐 Password Reset Request', html);
  }
}

module.exports = EmailService;
