const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// Helper function to get investment stats
const getInvestmentStatsHelper = async (userId) => {
    const [stats] = await pool.execute(
        `SELECT 
            COALESCE((SELECT SUM(amount) FROM payment_transactions WHERE user_id = ? AND status = 'confirmed'), 0) as total_invested,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_investments,
            COALESCE(SUM(CASE WHEN status = 'active' THEN expected_return ELSE 0 END), 0) as total_returns,
            COALESCE(SUM(CASE WHEN status = 'active' THEN current_value ELSE 0 END), 0) as current_value,
            COALESCE((SELECT SUM(amount) FROM payment_transactions WHERE user_id = ? AND status = 'confirmed'), 0) as total_paid
         FROM user_investments WHERE user_id = ?`,
        [userId, userId, userId]
    );
    return stats[0];
};

// Get all investment packages
router.get('/packages', authenticateToken, async (req, res) => {
    try {
        const [packages] = await pool.execute(
            `SELECT * FROM investment_packages WHERE is_active = TRUE ORDER BY min_investment ASC`
        );
        res.json({ success: true, data: packages });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch investment packages' });
    }
});

// Get user's investments
router.get('/my-investments', authenticateToken, async (req, res) => {
    try {
        const [investments] = await pool.execute(
            `SELECT ui.*, 
                    ip.package_name, 
                    ip.return_multiplier, 
                    ip.daily_yield_rate,
                    ip.min_investment,
                    COALESCE(ps.paid_amount, 0) as paid_amount,
                    COALESCE(ps.remaining_amount, ui.investment_amount) as remaining_amount
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
             WHERE ui.user_id = ?
             ORDER BY ui.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: investments });
    } catch (error) {
        console.error('Error fetching investments:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch investments' });
    }
});

// Get investment stats summary
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const stats = await getInvestmentStatsHelper(req.user.id);
        res.json({ success: true, data: { summary: stats } });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch investment statistics' });
    }
});

// Get yield history for an investment
router.get('/:id/yield-history', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [investments] = await pool.execute(
            `SELECT ui.*, ip.daily_yield_rate, ip.package_name
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             WHERE ui.id = ? AND ui.user_id = ?`,
            [id, userId]
        );

        if (investments.length === 0) {
            return res.status(404).json({ success: false, error: 'Investment not found' });
        }

        const investment = investments[0];
        
        if (investment.status !== 'active') {
            return res.json({
                success: true,
                data: {
                    history: [],
                    totalYield: 0,
                    currentValue: parseFloat(investment.investment_amount),
                    daysActive: 0,
                    message: 'Investment not yet active'
                }
            });
        }

        const dailyRate = parseFloat(investment.daily_yield_rate) / 100;
        const startDate = new Date(investment.yield_start_date);
        const today = new Date();
        const daysActive = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        
        const history = [];
        let currentValue = parseFloat(investment.investment_amount);
        const maxDays = Math.min(daysActive, 180);
        
        for (let day = 1; day <= maxDays; day++) {
            const dailyYield = currentValue * dailyRate;
            const endValue = currentValue + dailyYield;
            
            history.push({
                day: day,
                date: new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000).toISOString(),
                startValue: currentValue,
                yieldEarned: dailyYield,
                endValue: endValue
            });
            currentValue = endValue;
        }
        
        const totalYield = history.reduce((sum, h) => sum + h.yieldEarned, 0);
        
        res.json({
            success: true,
            data: {
                history,
                totalYield,
                currentValue: currentValue,
                daysActive,
                dailyRate: investment.daily_yield_rate
            }
        });
    } catch (error) {
        console.error('Error fetching yield history:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch yield history' });
    }
});

// Get single investment
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [investments] = await pool.execute(
            `SELECT ui.*,
                    ip.package_name,
                    ip.return_multiplier,
                    ip.daily_yield_rate,
                    ip.min_investment,
                    ip.max_investment,
                    COALESCE(ps.paid_amount, 0) as paid_amount,
                    COALESCE(ps.remaining_amount, ui.investment_amount) as remaining_amount
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
             WHERE ui.id = ? AND ui.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (investments.length === 0) {
            return res.status(404).json({ success: false, error: 'Investment not found' });
        }

        res.json({ success: true, data: investments[0] });
    } catch (error) {
        console.error('Error fetching investment:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch investment details' });
    }
});

// Create new investment
router.post('/create',
    authenticateToken,
    [
        body('package_id').isInt().withMessage('Valid package ID required'),
        body('investment_amount').isFloat({ min: 500 }).withMessage('Investment amount must be at least $500')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const connection = await pool.getConnection();
        try {
            const { package_id, investment_amount } = req.body;
            const user_id = req.user.id;

            await connection.beginTransaction();

            const [packages] = await connection.execute(
                `SELECT * FROM investment_packages WHERE id = ? AND is_active = TRUE`,
                [package_id]
            );

            if (packages.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, error: 'Investment package not found' });
            }

            const pkg = packages[0];

            if (investment_amount < 500) {
                await connection.rollback();
                return res.status(400).json({ success: false, error: 'Minimum investment is $500' });
            }
            
            if (investment_amount > pkg.max_investment) {
                await connection.rollback();
                return res.status(400).json({ success: false, error: `Maximum investment amount is $${pkg.max_investment}` });
            }

            const expected_return = investment_amount * pkg.return_multiplier;

            const [result] = await connection.execute(
                `INSERT INTO user_investments 
                 (user_id, package_id, investment_amount, expected_return, status, payment_deadline, current_value)
                 VALUES (?, ?, ?, ?, 'pending_payment', DATE_ADD(NOW(), INTERVAL 14 DAY), ?)`,
                [user_id, package_id, investment_amount, expected_return, investment_amount]
            );
            
            const investment_id = result.insertId;

            await connection.execute(
                `INSERT INTO payment_schedule
                 (user_id, investment_id, due_date, total_required, remaining_amount)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY), ?, ?)`,
                [user_id, investment_id, investment_amount, investment_amount]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                data: { id: investment_id, message: 'Investment created successfully' }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error creating investment:', error);
            res.status(500).json({ success: false, error: 'Failed to create investment' });
        } finally {
            connection.release();
        }
    }
);

module.exports = router;
