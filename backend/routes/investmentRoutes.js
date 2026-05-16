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
    console.error('Token error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// GET /api/investments/packages - Get all packages (public)
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

// GET /api/investments/my-investments - Get current user's investments
router.get('/my-investments', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`Fetching investments for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('user_investments')
      .select('*, investment_packages(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} investments`);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/investments/stats/summary - Get user stats
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'confirmed');
    
    const totalInvested = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    const { data: investments } = await supabase
      .from('user_investments')
      .select('status, expected_return, current_value')
      .eq('user_id', userId);
    
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

// GET /api/investments/:id - Get single investment by ID (FIXED)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const investmentId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    console.log(`Fetching investment ${investmentId} for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_investments')
      .select('*, investment_packages(*)')
      .eq('id', investmentId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ success: false, error: 'Investment not found' });
    }
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Investment not found' });
    }
    
    // Get paid amount from confirmed payments
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('investment_id', investmentId)
      .eq('status', 'confirmed');
    
    const paidAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    data.paid_amount = paidAmount;
    data.remaining_amount = data.investment_amount - paidAmount;
    
    console.log(`Found investment: ${data.id} for user ${userId}`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Error fetching investment detail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/investments/create - Create new investment
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { package_id, investment_amount } = req.body;
    const userId = req.user.userId;
    
    console.log(`Creating investment for user ${userId}: amount=$${investment_amount}`);
    
    // Get package
    const { data: pkg, error: pkgError } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('id', package_id)
      .single();
    
    if (pkgError || !pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }
    
    if (investment_amount < 500) {
      return res.status(400).json({ success: false, error: 'Minimum investment is $500' });
    }
    
    const expected_return = investment_amount * pkg.return_multiplier;
    
    const { data: newInvestment, error: insertError } = await supabase
      .from('user_investments')
      .insert({
        user_id: userId,
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
    
    console.log(`Investment created: ID=${newInvestment.id}`);
    res.status(201).json({ success: true, data: { id: newInvestment.id, message: 'Investment created' } });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
