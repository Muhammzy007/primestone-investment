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

// Get user's withdrawals
router.get('/my-withdrawals', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// Request withdrawal
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { amount, btcAddress } = req.body;
    
    if (amount < 100) {
      return res.status(400).json({ success: false, error: 'Minimum withdrawal is $100' });
    }
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert([{
        user_id: req.user.userId,
        amount: amount,
        btc_address: btcAddress,
        status: 'pending'
      }])
      .select();
    
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get pending withdrawals
router.get('/admin/pending', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, users(username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// Admin: Approve withdrawal
router.post('/admin/approve/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'approved', approved_at: new Date(), approved_by: req.user.userId })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Reject withdrawal
router.post('/admin/reject/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    
    const { id } = req.params;
    const { reason } = req.body;
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
