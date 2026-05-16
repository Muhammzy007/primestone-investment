const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const EmailService = require('../services/emailService');

const emailService = new EmailService();

// Forgot password - Send reset email
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { email } = req.body;
    console.log(`Password reset requested for: ${email}`);

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('email', email)
      .maybeSingle();

    // For security, always return success even if user not found
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.json({ success: true, message: 'If an account exists, a reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        reset_token: tokenHash, 
        reset_expires: expiresAt.toISOString() 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error saving token:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to process request' });
    }

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'https://primestone-investment.netlify.app'}/reset-password?token=${resetToken}`;
    
    console.log(`Sending password reset email to: ${email}`);
    console.log(`Reset link: ${resetLink}`);

    // Send email
    const emailResult = await emailService.sendPasswordResetEmail(email, user.username, resetLink);
    
    if (emailResult.success) {
      console.log(`✅ Password reset email sent to ${email}`);
    } else {
      console.error(`❌ Failed to send password reset email: ${emailResult.error}`);
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account exists, a reset link will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
});

// Reset password - Verify token and update password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { token, newPassword } = req.body;
    console.log(`Password reset attempt with token: ${token.substring(0, 20)}...`);

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('reset_token', tokenHash)
      .gt('reset_expires', new Date().toISOString())
      .maybeSingle();

    if (!user) {
      console.log('Invalid or expired token');
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword, 
        reset_token: null, 
        reset_expires: null 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to reset password' });
    }

    console.log(`✅ Password reset successful for user: ${user.email}`);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// Verify reset token (for frontend validation)
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('reset_token', tokenHash)
      .gt('reset_expires', new Date().toISOString())
      .maybeSingle();

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    res.json({ success: true, message: 'Token is valid' });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify token' });
  }
});

module.exports = router;
