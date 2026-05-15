const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'primestone-secure-jwt-secret-2024';

// Verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin token error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Get admin dashboard stats
router.get('/dashboard/stats', verifyAdmin, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) console.error('Users count error:', usersError);
    
    // Get total investments
    const { count: totalInvestments, error: invError } = await supabase
      .from('user_investments')
      .select('*', { count: 'exact', head: true });
    
    if (invError) console.error('Investments count error:', invError);
    
    // Get total received
    const { data: payments, error: payError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'confirmed');
    
    if (payError) console.error('Payments error:', payError);
    
    const totalReceived = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    res.json({
      success: true,
      data: {
        statistics: {
          total_users: totalUsers || 0,
          total_investments: totalInvestments || 0,
          total_received: totalReceived
        }
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    // Always return success with empty data to avoid frontend crashes
    res.json({ 
      success: true, 
      data: { 
        statistics: { total_users: 0, total_investments: 0, total_received: 0 } 
      } 
    });
  }
});

// Get all users (for admin panel)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Users list error:', error);
    res.json({ success: true, data: [] });
  }
});

// Toggle user status
router.post('/users/:userId/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);
    
    if (error) throw error;
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
