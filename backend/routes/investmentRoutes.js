const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'primestone-secure-jwt-secret-2024';

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Get all investment packages
router.get('/packages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Packages error:', error);
    res.json({ success: true, data: [] });
  }
});

// Get user's investments
router.get('/my-investments', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_investments')
      .select('*, investment_packages(*)')
      .eq('user_id', req.user.userId);
    
    if (error) throw error;
    
    // Add paid_amount from payment_transactions
    for (let inv of (data || [])) {
      const { data: payments } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('investment_id', inv.id)
        .eq('status', 'confirmed');
      inv.paid_amount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    }
    
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('My investments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get investment stats
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    // Get total invested from confirmed payments
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('user_id', req.user.userId)
      .eq('status', 'confirmed');
    
    const totalInvested = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    
    // Get investments
    const { data: investments } = await supabase
      .from('user_investments')
      .select('status, expected_return, current_value')
      .eq('user_id', req.user.userId);
    
    const activeInvestments = investments?.filter(i => i.status === 'active').length || 0;
    const totalReturns = investments?.reduce((sum, i) => sum + (i.expected_return || 0), 0) || 0;
    const currentValue = investments?.reduce((sum, i) => sum + (i.current_value || 0), 0) || 0;
    
    res.json({ 
      success: true, 
      data: { 
        summary: { 
          total_invested: totalInvested, 
          active_investments: activeInvestments, 
          total_returns: totalReturns, 
          current_value: currentValue 
        } 
      } 
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ success: true, data: { summary: { total_invested: 0, active_investments: 0, total_returns: 0, current_value: 0 } } });
  }
});

module.exports = router;
