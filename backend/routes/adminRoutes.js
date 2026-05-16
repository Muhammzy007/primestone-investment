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
      .select('id, username, email, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`✅ Admin fetched ${data?.length || 0} users`);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', verifyAdmin, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    // Get users from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: newUsers7d } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    
    // Get total investments
    const { count: totalInvestments } = await supabase.from('user_investments').select('*', { count: 'exact', head: true });
    
    // Get active investments
    const { count: activeInvestments } = await supabase.from('user_investments').select('*', { count: 'exact', head: true }).eq('status', 'active');
    
    // Get pending withdrawals
    const { count: pendingWithdrawals } = await supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    // Get total received
    const { data: payments } = await supabase.from('payment_transactions').select('amount').eq('status', 'confirmed');
    const totalReceived = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    res.json({
      success: true,
      data: {
        statistics: {
          total_users: totalUsers || 0,
          new_users_7d: newUsers7d || 0,
          total_investments: totalInvestments || 0,
          active_investments: activeInvestments || 0,
          pending_withdrawals: pendingWithdrawals || 0,
          total_received: totalReceived
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ success: true, data: { statistics: {} } });
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
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
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
