const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const YieldService = require('../services/yieldService');

const yieldService = new YieldService();

// Get all investment packages
router.get('/packages', async (req, res) => {
    try {
        const [packages] = await pool.execute(
            `SELECT * FROM investment_packages WHERE is_active = TRUE ORDER BY min_investment ASC`
        );
        
        const packagesWithProjection = packages.map(pkg => ({
            ...pkg,
            projected_return: pkg.min_investment * (1 + pkg.yield_rate/100),
            max_return: pkg.max_investment * (1 + pkg.yield_rate/100),
            daily_growth_rate: yieldService.getDailyRate(pkg.yield_rate) * 100
        }));

        res.json({
            success: true,
            data: packagesWithProjection
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investment packages'
        });
    }
});

// Create new investment
router.post('/create',
    authenticateToken,
    [
        body('packageId').isInt().withMessage('Valid package ID required'),
        body('amount').isFloat({ min: 1000 }).withMessage('Minimum investment is $1000')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const connection = await pool.getConnection();
        
        try {
            const { packageId, amount } = req.body;
            const userId = req.user.id;

            await connection.beginTransaction();

            // Get package details
            const [packages] = await connection.execute(
                `SELECT * FROM investment_packages WHERE id = ? AND is_active = TRUE`,
                [packageId]
            );

            if (packages.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Investment package not found'
                });
            }

            const pkg = packages[0];

            // Validate amount within package limits
            if (amount < pkg.min_investment || amount > pkg.max_investment) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: `Investment amount must be between $${pkg.min_investment} and $${pkg.max_investment}`
                });
            }

            // Expected return based on yield rate
            const expectedReturn = amount * (1 + pkg.yield_rate/100);

            // Create investment record (no deadline)
            const [result] = await connection.execute(
                `INSERT INTO user_investments 
                (user_id, package_id, investment_amount, expected_return, status) 
                VALUES (?, ?, ?, ?, 'pending_payment')`,
                [userId, packageId, amount, expectedReturn]
            );

            const investmentId = result.insertId;

            // Create payment schedule (simple tracking)
            await connection.execute(
                `INSERT INTO payment_schedule 
                (user_id, investment_id, total_required, remaining_amount) 
                VALUES (?, ?, ?, ?)`,
                [userId, investmentId, amount, amount]
            );

            await connection.commit();

            console.log(`Investment created: User ${userId}, Package ${packageId}, Amount $${amount}`);

            res.status(201).json({
                success: true,
                data: {
                    investmentId: investmentId,
                    message: 'Investment created successfully',
                    amount: amount,
                    expectedReturn: expectedReturn,
                    yieldRate: pkg.yield_rate,
                    yieldPeriod: '6 months',
                    minimumPayment: 50
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error creating investment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create investment'
            });
        } finally {
            connection.release();
        }
    }
);

// Get user's investments
router.get('/my-investments', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [investments] = await pool.execute(
            `SELECT ui.*, 
                    ip.package_name, 
                    ip.yield_rate,
                    ip.return_multiplier,
                    ps.paid_amount,
                    ps.remaining_amount
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
             WHERE ui.user_id = ?
             ORDER BY ui.created_at DESC`,
            [userId]
        );

        // Enhance with yield progress for active investments
        const enhancedInvestments = await Promise.all(investments.map(async (inv) => {
            const enhanced = { ...inv };
            
            if (inv.status === 'active' && inv.yield_start_date) {
                try {
                    const progress = await yieldService.getYieldProgress(inv.id);
                    enhanced.yieldProgress = progress;
                } catch (error) {
                    console.error(`Error getting yield progress for investment ${inv.id}:`, error);
                }
            }
            
            return enhanced;
        }));

        res.json({
            success: true,
            data: enhancedInvestments
        });

    } catch (error) {
        console.error('Error fetching investments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investments'
        });
    }
});

// Get specific investment details
router.get('/:investmentId', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const userId = req.user.id;

        const [investments] = await pool.execute(
            `SELECT ui.*, 
                    ip.package_name, 
                    ip.yield_rate,
                    ip.return_multiplier,
                    ip.description as package_description,
                    ps.paid_amount,
                    ps.remaining_amount,
                    u.username,
                    u.email
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
             JOIN users u ON ui.user_id = u.id
             WHERE ui.id = ? AND ui.user_id = ?`,
            [investmentId, userId]
        );

        if (investments.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Investment not found'
            });
        }

        const investment = investments[0];

        // Get yield progress if active
        let yieldProgress = null;
        if (investment.status === 'active' && investment.yield_start_date) {
            yieldProgress = await yieldService.getYieldProgress(investmentId);
        }

        // Get payment history
        const [payments] = await pool.execute(
            `SELECT * FROM payment_transactions 
             WHERE investment_id = ? 
             ORDER BY payment_date DESC`,
            [investmentId]
        );

        // Get withdrawal fee status
        const [feePayment] = await pool.execute(
            `SELECT * FROM fee_payments 
             WHERE investment_id = ? 
             ORDER BY payment_date DESC 
             LIMIT 1`,
            [investmentId]
        );

        // Get yield projection
        const projection = yieldService.getProjection(investment.investment_amount, investment.yield_rate);

        res.json({
            success: true,
            data: {
                ...investment,
                yieldProgress,
                payments,
                feePayment: feePayment[0] || null,
                projection
            }
        });

    } catch (error) {
        console.error('Error fetching investment details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investment details'
        });
    }
});

// Get investment yield progress
router.get('/:investmentId/yield', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const userId = req.user.id;

        const [investment] = await pool.execute(
            `SELECT * FROM user_investments WHERE id = ? AND user_id = ?`,
            [investmentId, userId]
        );

        if (investment.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Investment not found'
            });
        }

        const progress = await yieldService.getYieldProgress(investmentId);

        res.json({
            success: true,
            data: progress
        });

    } catch (error) {
        console.error('Error fetching yield progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch yield progress'
        });
    }
});

// Get investment projection
router.get('/:investmentId/projection', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const userId = req.user.id;

        const [investment] = await pool.execute(
            `SELECT ui.investment_amount, ip.yield_rate 
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             WHERE ui.id = ? AND ui.user_id = ?`,
            [investmentId, userId]
        );

        if (investment.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Investment not found'
            });
        }

        const projection = yieldService.getProjection(
            investment[0].investment_amount, 
            investment[0].yield_rate
        );

        res.json({
            success: true,
            data: projection
        });

    } catch (error) {
        console.error('Error generating projection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate projection'
        });
    }
});

// Get investment statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_investments,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_investments,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_investments,
                SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending_investments,
                SUM(investment_amount) as total_invested,
                SUM(expected_return) as total_expected,
                SUM(CASE WHEN status = 'active' THEN current_value ELSE 0 END) as current_value
             FROM user_investments 
             WHERE user_id = ?`,
            [userId]
        );

        const [recent] = await pool.execute(
            `SELECT ui.id, ui.investment_amount, ui.status, ui.created_at,
                    ip.package_name
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             WHERE ui.user_id = ?
             ORDER BY ui.created_at DESC
             LIMIT 5`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                summary: stats[0],
                recent: recent
            }
        });

    } catch (error) {
        console.error('Error fetching investment stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investment statistics'
        });
    }
});

// Calculate projected returns
router.post('/calculate', authenticateToken, async (req, res) => {
    try {
        const { amount, packageId } = req.body;

        const [packages] = await pool.execute(
            `SELECT * FROM investment_packages WHERE id = ?`,
            [packageId]
        );

        if (packages.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Package not found'
            });
        }

        const pkg = packages[0];
        
        if (amount < pkg.min_investment || amount > pkg.max_investment) {
            return res.status(400).json({
                success: false,
                error: `Amount must be between $${pkg.min_investment} and $${pkg.max_investment}`
            });
        }

        const expectedReturn = amount * (1 + pkg.yield_rate/100);
        const projection = yieldService.getProjection(amount, pkg.yield_rate);
        const dailyRate = yieldService.getDailyRate(pkg.yield_rate);

        res.json({
            success: true,
            data: {
                investmentAmount: amount,
                expectedReturn: expectedReturn,
                profit: expectedReturn - amount,
                package: pkg.package_name,
                yieldRate: pkg.yield_rate,
                dailyRate: dailyRate * 100,
                duration: '6 months (180 days)',
                projection: projection.slice(0, 30), // First 30 days
                finalValue: projection[projection.length - 1].value
            }
        });

    } catch (error) {
        console.error('Error calculating returns:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate returns'
        });
    }
});

module.exports = router;
