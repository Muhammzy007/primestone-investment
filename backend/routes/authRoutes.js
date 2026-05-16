const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const EmailService = require('../services/emailService');

const emailService = new EmailService();
const JWT_SECRET = process.env.JWT_SECRET || 'primestone-secure-jwt-secret-2024';

// Generate token with correct user ID
const generateToken = (userId, role, username) => {
  console.log('Generating token for:', { userId, role, username });
  return jwt.sign({ userId, role, username }, JWT_SECRET, { expiresIn: '7d' });
};

// REGISTER - Create new user and return correct user data
router.post('/register', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ 
        username, 
        email, 
        password_hash: hashedPassword, 
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ success: false, error: insertError.message });
    }

    console.log('New user created:', { id: newUser.id, username: newUser.username, email: newUser.email });

    // Generate token for the NEW user
    const token = generateToken(newUser.id, 'user', newUser.username);

    // Send welcome email (don't block registration)
    emailService.sendWelcomeEmail(email, username).catch(err => console.error('Email error:', err.message));

    // Return the NEW user's data
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: 'user'
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGIN - Return correct user data for the logged-in user
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account deactivated. Contact admin.' });
    }

    console.log('User logged in:', { id: user.id, username: user.username, role: user.role });

    // Generate token for THIS user
    const token = generateToken(user.id, user.role, user.username);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return THIS user's data
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET CURRENT USER - Verify token and return correct user
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('Returning user data for:', user.username);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;
