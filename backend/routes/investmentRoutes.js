const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
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
router.post('/create', verifyToken, [
  body('package_id').isInt(),
  body('investment_amount').isFloat({ min: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { package_id, investment_amount } = req.body;
    const user_id = req.user.userId;

    // Get package details
    const { data: packages, error: pkgError } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (pkgError || !packages) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    const pkg = packages;

    // Validate amount
    if (investment_amount < 500) {
      return res.status(400).json({ success: false, error: 'Minimum investment is $500' });
    }
    
    if (investment_amount > pkg.max_investment) {
      return res.status(400).json({ success: false, error: `Maximum is $${pkg.max_investment}` });
    }

    // Calculate expected return
    const expected_return = investment_amount * pkg.return_multiplier;

    // Insert investment
    const { data: newInvestment, error: insertError } = await supabase
      .from('user_investments')
      .insert([{
        user_id: user_id,
        package_id: package_id,
        investment_amount: investment_amount,
        expected_return: expected_return,
        status: 'pending_payment',
        current_value: investment_amount,
        created_at: new Date()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ success: false, error: insertError.message });
    }

    // Create payment schedule record
    await supabase
      .from('payment_schedule')
      .insert([{
        user_id: user_id,
        investment_id: newInvestment.id,
        total_required: investment_amount,
        remaining_amount: investment_amount,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }]);

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
