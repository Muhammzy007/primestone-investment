const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const { getPackages, getUserInvestments, getInvestmentStats, createInvestment } = require('../controllers/investmentController');

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
router.get('/packages', getPackages);

// GET /api/investments/my-investments - Get current user's investments
router.get('/my-investments', verifyToken, getUserInvestments);

// GET /api/investments/stats/summary - Get user stats
router.get('/stats/summary', verifyToken, getInvestmentStats);

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
    const { data: payments, error: payError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('investment_id', investmentId)
      .eq('status', 'confirmed');
    
    if (payError) {
      console.error('Payment fetch error:', payError);
    }
    
    const paidAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    data.paid_amount = paidAmount;
    data.remaining_amount = data.investment_amount - paidAmount;
    
    console.log(`Investment found: ${data.id}, Package: ${data.investment_packages?.package_name}`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/investments/create - Create new investment
router.post('/create', 
  verifyToken,
  [
    body('package_id').isInt().withMessage('Valid package ID required'),
    body('investment_amount').isFloat({ min: 100 }).withMessage('Minimum investment is $100')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    createInvestment(req, res);
  }
);

module.exports = router;
