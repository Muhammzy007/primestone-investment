const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const EmailService = require('../services/emailService');
const emailService = new EmailService();

router.post('/forgot-password', [body('email').isEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  try {
    const { email } = req.body;
    const { data: user } = await supabase.from('users').select('id, username').eq('email', email).maybeSingle();
    if (!user) return res.json({ success: true, message: 'If email exists, reset link sent' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    await supabase.from('users').update({ reset_token: tokenHash, reset_expires: new Date(Date.now() + 3600000) }).eq('id', user.id);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordResetEmail(email, user.username, resetLink);
    res.json({ success: true, message: 'If email exists, reset link sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reset-password', [body('token').notEmpty(), body('newPassword').isLength({ min: 6 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  try {
    const { token, newPassword } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data: user } = await supabase.from('users').select('id').eq('reset_token', tokenHash).gt('reset_expires', new Date().toISOString()).maybeSingle();
    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password_hash: hashedPassword, reset_token: null, reset_expires: null }).eq('id', user.id);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
