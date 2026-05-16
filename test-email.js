const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    const result = await transporter.sendMail({
      from: `"PrimeStone Test" <${process.env.SMTP_USER}>`,
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test Successful!</h1>'
    });
    console.log('✅ Email sent! Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
}

testEmail();
