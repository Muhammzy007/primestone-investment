const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'primestone-secure-jwt-secret-2024';

// Admin verification middleware
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('=== ADMIN VERIFICATION ===');
  console.log('Token present:', !!token);
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', { userId: decoded.userId, role: decoded.role });
    
    if (decoded.role !== 'admin') {
      console.log(`Access denied: User ${decoded.userId} has role ${decoded.role}, not admin`);
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    req.user = decoded;
    console.log(`✅ Admin verified: ${decoded.userId}`);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', verifyAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard stats...');
    
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) console.error('Users count error:', usersError);
    
    // Get total investments count
    const { count: totalInvestments, error: invError } = await supabase
      .from('user_investments')
      .select('*', { count: 'exact', head: true });
    
    if (invError) console.error('Investments count error:', invError);
    
    // Get pending withdrawals count
    const { count: pendingWithdrawals, error: wdError } = await supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (wdError) console.error('Withdrawals count error:', wdError);
    
    // Get total received from confirmed payments
    const { data: payments, error: payError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'confirmed');
    
    if (payError) console.error('Payments error:', payError);
    
    const totalReceived = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    const stats = {
      total_users: totalUsers || 0,
      total_investments: totalInvestments || 0,
      pending_withdrawals: pendingWithdrawals || 0,
      total_received: totalReceived
    };
    
    console.log('📊 Admin stats returning:', stats);
    res.json({ success: true, data: { statistics: stats } });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ success: true, data: { statistics: { total_users: 0, total_investments: 0, pending_withdrawals: 0, total_received: 0 } } });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    console.log('👥 Fetching all users...');
    
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`✅ Found ${data?.length || 0} users`);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/users/:userId/toggle-status - Activate/Deactivate user
router.post('/users/:userId/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    console.log(`🔄 Toggling user ${userId} status to: ${isActive ? 'active' : 'inactive'}`);
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', parseInt(userId));
    
    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`✅ User ${userId} ${isActive ? 'activated' : 'deactivated'}`);
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Error toggling user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/withdrawals/pending - Get pending withdrawals
router.get('/withdrawals/pending', verifyAdmin, async (req, res) => {
  try {
    console.log('💰 Fetching pending withdrawals...');
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, users(id, username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching withdrawals:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`✅ Found ${data?.length || 0} pending withdrawals`);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/withdrawals/:id/approve - Approve withdrawal
router.post('/withdrawals/:id/approve', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Approving withdrawal ${id}`);
    
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'approved', 
        approved_at: new Date().toISOString(),
        approved_by: req.user.userId
      })
      .eq('id', parseInt(id));
    
    if (error) throw error;
    
    console.log(`✅ Withdrawal ${id} approved`);
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/withdrawals/:id/reject - Reject withdrawal
router.post('/withdrawals/:id/reject', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    console.log(`❌ Rejecting withdrawal ${id}, reason: ${reason}`);
    
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'rejected', 
        rejection_reason: reason 
      })
      .eq('id', parseInt(id));
    
    if (error) throw error;
    
    console.log(`✅ Withdrawal ${id} rejected`);
    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/transactions - Get all transactions
router.get('/transactions', verifyAdmin, async (req, res) => {
  try {
    console.log('📋 Fetching transactions...');
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*, users(id, username, email)')
      .order('id', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    console.log(`✅ Found ${data?.length || 0} transactions`);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
