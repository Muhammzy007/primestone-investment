const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'primestone-secure-jwt-secret-2024';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Get user's payments
router.get('/my-payments', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// Mark payment as sent - FIXED
router.post('/mark-sent', verifyToken, async (req, res) => {
  console.log('Mark payment sent called with body:', req.body);
  console.log('User:', req.user);
  
  try {
    const { investmentId, amount, walletAddress } = req.body;
    
    if (!investmentId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: req.user.userId,
        investment_id: investmentId,
        amount: amount,
        payment_method: 'BTC',
        status: 'pending',
        wallet_address: walletAddress || 'bc1qa54zw7f8c7ekp78fpvmqgq4uzexgzfwgfuvvle',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('Payment recorded:', data);
    res.json({ success: true, data: data[0], message: 'Payment notification sent to admin' });
  } catch (error) {
    console.error('Mark payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get pending payments
router.get('/admin/pending', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*, users(id, username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// Admin: Approve payment
router.post('/admin/approve/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, message: 'Payment approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
