const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const EmailService = require('../services/emailService');

const emailService = new EmailService();

// Forgot password - send reset email
router.post('/forgot-password', [
  body('email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { email } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      // Don't reveal that user doesn't exist
      return res.json({ success: true, message: 'If an account exists, a reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await supabase
      .from('users')
      .update({ reset_token: tokenHash, reset_expires: expiresAt })
      .eq('id', user.id);

    const resetLink = `${process.env.FRONTEND_URL || 'https://primestone-investment.netlify.app'}/reset-password?token=${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail(email, user.username, resetLink);
    console.log('Password reset email sent to:', email);

    res.json({ success: true, message: 'If an account exists, a reset link will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { token, newPassword } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('reset_token', tokenHash)
      .gt('reset_expires', new Date().toISOString())
      .maybeSingle();

    if (error || !user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('users')
      .update({ password_hash: hashedPassword, reset_token: null, reset_expires: null })
      .eq('id', user.id);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
