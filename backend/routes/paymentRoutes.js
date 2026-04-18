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

// Mark payment as sent (manual verification)
router.post('/mark-sent', verifyToken, async (req, res) => {
  try {
    const { investmentId, amount, walletAddress } = req.body;
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([{
        user_id: req.user.userId,
        investment_id: investmentId,
        amount: amount,
        payment_method: 'BTC',
        status: 'pending',
        wallet_address: walletAddress
      }])
      .select();
    
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get pending payments
router.get('/admin/pending', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*, users(username, email)')
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
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({ status: 'confirmed', confirmed_at: new Date() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // Also update investment paid_amount
    if (data[0]) {
      await supabase.rpc('update_investment_paid_amount', { p_payment_id: id });
    }
    
    res.json({ success: true, message: 'Payment approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
