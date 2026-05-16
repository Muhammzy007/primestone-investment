require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🔍 Testing Email Configuration...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
  
  // Try Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  try {
    console.log('\n📧 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Try sending a test email
    console.log('\n📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"PrimeStone Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Email from PrimeStone',
      html: '<h1>✅ Email is working!</h1><p>Your PrimeStone investment platform email configuration is correct.</p>'
    });
    console.log('✅ Test email sent! Message ID:', info.messageId);
    console.log('📧 Check your inbox/spam folder at:', process.env.SMTP_USER);
    
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Generate a new App Password at: https://myaccount.google.com/apppasswords');
    console.log('2. Make sure "Less secure app access" is turned ON');
    console.log('3. Check if your network allows SMTP on port 587');
  }
}

testEmail();
