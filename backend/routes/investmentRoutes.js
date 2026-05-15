const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'primestone-secure-jwt-secret-2024';

// Verify token and attach user
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
    console.error('Token verification error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Get all investment packages
router.get('/packages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('is_active', true)
      .order('min_investment', { ascending: true });
    
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
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('My investments error:', error);
    res.json({ success: true, data: [] });
  }
});

// Get investment stats
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('user_id', req.user.userId)
      .eq('status', 'confirmed');
    
    const totalInvested = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    
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
    res.json({ success: true, data: { summary: { total_invested: 0, active_investments: 0, total_returns: 0, current_value: 0 } } });
  }
});

// Create new investment - FIXED
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { package_id, investment_amount } = req.body;
    const user_id = req.user.userId;

    console.log('Create investment request:', { user_id, package_id, investment_amount });

    // Validate amount
    if (!investment_amount || investment_amount < 500) {
      return res.status(400).json({ success: false, error: 'Minimum investment is $500' });
    }

    // Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (pkgError || !pkg) {
      console.error('Package not found:', pkgError);
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Validate max investment
    if (investment_amount > pkg.max_investment) {
      return res.status(400).json({ success: false, error: `Maximum investment is $${pkg.max_investment}` });
    }

    // Calculate expected return
    const expected_return = investment_amount * pkg.return_multiplier;

    // Insert investment
    const { data: newInvestment, error: insertError } = await supabase
      .from('user_investments')
      .insert({
        user_id: user_id,
        package_id: package_id,
        investment_amount: investment_amount,
        expected_return: expected_return,
        current_value: investment_amount,
        status: 'pending_payment',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ success: false, error: insertError.message });
    }

    console.log('Investment created:', newInvestment);

    res.status(201).json({
      success: true,
      data: { id: newInvestment.id, message: 'Investment created successfully' }
    });

  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
