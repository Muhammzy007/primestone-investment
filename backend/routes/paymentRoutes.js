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

// Mark payment as sent
router.post('/mark-sent', verifyToken, async (req, res) => {
  console.log('Mark payment sent called:', req.body);
  console.log('User:', req.user);
  
  try {
    const { investmentId, amount, walletAddress } = req.body;
    
    if (!investmentId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing investmentId or amount' });
    }
    
    // Check if payment already exists
    const { data: existing } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('investment_id', investmentId)
      .eq('user_id', req.user.userId)
      .maybeSingle();
    
    if (existing) {
      return res.status(400).json({ success: false, error: 'Payment already submitted for this investment' });
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

// Admin: Get pending payments
router.get('/admin/pending', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin required' });
    }
    
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
router.post('/admin/approve/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin required' });
    }
    
    const { id } = req.params;
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // Update investment paid_amount
    if (data[0]) {
      const { data: payments } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('investment_id', data[0].investment_id)
        .eq('status', 'confirmed');
      
      const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      
      await supabase
        .from('user_investments')
        .update({ paid_amount: totalPaid })
        .eq('id', data[0].investment_id);
    }
    
    res.json({ success: true, message: 'Payment approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
