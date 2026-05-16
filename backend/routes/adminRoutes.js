const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'primestone-secure-jwt-secret-2024';

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin required' });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// GET /api/admin/users - Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    console.log(`✅ Admin fetched ${data?.length || 0} users`);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/dashboard/stats - Get dashboard statistics
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
    
    // Get pending withdrawals
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
    
    console.log('📊 Admin stats:', stats);
    
    res.json({
      success: true,
      data: { statistics: stats }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ success: true, data: { statistics: { total_users: 0, total_investments: 0, pending_withdrawals: 0, total_received: 0 } } });
  }
});

// POST /api/admin/users/:userId/toggle-status - Activate/Deactivate user
router.post('/users/:userId/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', parseInt(userId));
    
    if (error) throw error;
    
    console.log(`✅ User ${userId} ${isActive ? 'activated' : 'deactivated'}`);
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/withdrawals/pending
router.get('/withdrawals/pending', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, users(id, username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// POST /api/admin/withdrawals/:id/approve
router.post('/withdrawals/:id/approve', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await supabase
      .from('withdrawal_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', parseInt(id));
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/withdrawals/:id/reject
router.post('/withdrawals/:id/reject', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', parseInt(id));
    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/transactions
router.get('/transactions', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*, users(id, username, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
