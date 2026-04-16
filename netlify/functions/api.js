const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Your Supabase credentials
const supabaseUrl = 'https://qhifesrpnjewneokrvcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaWZlc3Jwbmpld25lb2tydmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTEzNTAsImV4cCI6MjA5MTkyNzM1MH0.1xzjzEPJIq2PW3sN2TdZeO-3DnB6FxATKppEJErD4Yw';
const supabase = createClient(supabaseUrl, supabaseKey);
const JWT_SECRET = 'primestone-secure-jwt-secret-2024';

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const { data: existing } = await supabase.from('users').select('id').eq('email', email);
    if (existing?.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, email, password_hash: hashedPassword, role: 'user' }])
      .select();
    
    if (error) throw error;
    
    const token = jwt.sign({ userId: data[0].id }, JWT_SECRET);
    res.json({ success: true, data: { token, user: { id: data[0].id, username, email, role: 'user' } } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data: users, error } = await supabase.from('users').select('*').eq('email', email);
    if (error || !users?.length) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ success: true, data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get packages
app.get('/api/investments/packages', async (req, res) => {
  try {
    const { data, error } = await supabase.from('investment_packages').select('*').eq('is_active', true);
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

exports.handler = serverless(app);
