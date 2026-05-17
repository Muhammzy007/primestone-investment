const { supabase } = require('../config/database');

// Get user's investments
const getUserInvestments = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const { data, error } = await supabase
      .from('user_investments')
      .select('*, investment_packages(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get investment stats
const getInvestmentStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get total invested from confirmed payments
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'confirmed');
    
    const totalInvested = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    // Get investments
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
};

// Create investment
const createInvestment = async (req, res) => {
  try {
    const { package_id, investment_amount } = req.body;
    const userId = req.user.userId;
    
    console.log(`Creating investment: package=${package_id}, amount=${investment_amount}, user=${userId}`);
    
    const { data: pkg, error: pkgError } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('id', package_id)
      .single();
    
    if (pkgError || !pkg) {
      console.error('Package not found:', pkgError);
      return res.status(404).json({ success: false, error: 'Package not found' });
    }
    
    // FIXED: Changed from 500 to 100
    if (investment_amount < 100) {
      console.log(`Investment amount ${investment_amount} is less than minimum 100`);
      return res.status(400).json({ success: false, error: 'Minimum investment is $100' });
    }
    
    if (investment_amount > pkg.max_investment) {
      console.log(`Investment amount ${investment_amount} exceeds max ${pkg.max_investment}`);
      return res.status(400).json({ success: false, error: `Maximum investment is $${pkg.max_investment}` });
    }
    
    const expected_return = investment_amount * pkg.return_multiplier;
    
    const { data: newInvestment, error } = await supabase
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
    
    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`Investment created successfully: ID=${newInvestment.id}`);
    res.status(201).json({ success: true, data: { id: newInvestment.id, message: 'Investment created successfully' } });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all packages
const getPackages = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('investment_packages')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
};

module.exports = { getPackages, getUserInvestments, getInvestmentStats, createInvestment };
