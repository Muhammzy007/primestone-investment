const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// ==================== DASHBOARD STATS ====================

// Get admin dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_users_7d,
                (SELECT COUNT(*) FROM user_investments) as total_investments,
                (SELECT COUNT(*) FROM user_investments WHERE status = 'active') as active_investments,
                (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
                (SELECT COUNT(*) FROM fee_payments WHERE status = 'pending') as pending_fees,
                COALESCE((SELECT SUM(amount) FROM payment_transactions WHERE status = 'confirmed'), 0) as total_received,
                COALESCE((SELECT SUM(requested_amount) FROM withdrawal_requests WHERE status = 'completed'), 0) as total_paid_out
        `);

        const [recentActivities] = await pool.execute(`
            (SELECT 'user' as type, id, username as title, created_at as date FROM users ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'investment' as type, id, CONCAT('Investment $', investment_amount) as title, created_at as date FROM user_investments ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'withdrawal' as type, id, CONCAT('Withdrawal $', requested_amount) as title, requested_at as date FROM withdrawal_requests ORDER BY requested_at DESC LIMIT 5)
            ORDER BY date DESC LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                statistics: stats[0],
                recentActivities
            }
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch admin statistics'
        });
    }
});

// Get all users with filters
router.get('/users', async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM users`;
        const params = [];

        if (search) {
            query += ` WHERE username LIKE ? OR email LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.execute(query, params);

        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM users${search ? ' WHERE username LIKE ? OR email LIKE ?' : ''}`,
            search ? [`%${search}%`, `%${search}%`] : []
        );

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// Toggle user status
router.post('/users/:userId/toggle-status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        const adminId = req.user.id;

        if (parseInt(userId) === adminId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot modify your own account'
            });
        }

        await pool.execute(
            `UPDATE users SET is_active = ? WHERE id = ?`,
            [isActive, userId]
        );

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user status'
        });
    }
});

// Get pending withdrawals
router.get('/withdrawals/pending', async (req, res) => {
    try {
        const [withdrawals] = await pool.execute(`
            SELECT wr.*, 
                   u.username, 
                   u.email,
                   ui.investment_amount, 
                   ui.expected_return
            FROM withdrawal_requests wr
            JOIN users u ON wr.user_id = u.id
            JOIN user_investments ui ON wr.investment_id = ui.id
            WHERE wr.status = 'pending'
            ORDER BY wr.requested_at ASC
        `);

        res.json({
            success: true,
            data: withdrawals
        });

    } catch (error) {
        console.error('Error fetching pending withdrawals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending withdrawals'
        });
    }
});

// Approve withdrawal
router.post('/withdrawals/:requestId/approve',
    [
        body('transactionHash').optional().isString()
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
            const { requestId } = req.params;
            const { transactionHash, notes } = req.body;
            const adminId = req.user.id;

            await connection.beginTransaction();

            const [requests] = await connection.execute(
                `SELECT * FROM withdrawal_requests WHERE id = ? AND status = 'pending'`,
                [requestId]
            );

            if (requests.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Withdrawal request not found'
                });
            }

            const finalTxHash = transactionHash || `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;

            await connection.execute(
                `UPDATE withdrawal_requests 
                 SET status = 'approved', 
                     approved_at = NOW(), 
                     approved_by = ?,
                     company_transaction_hash = ?,
                     admin_notes = ?
                 WHERE id = ?`,
                [adminId, finalTxHash, notes || null, requestId]
            );

            await connection.execute(
                `UPDATE user_investments 
                 SET status = 'withdrawn'
                 WHERE id = ?`,
                [requests[0].investment_id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Withdrawal approved successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error approving withdrawal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to approve withdrawal'
            });
        } finally {
            connection.release();
        }
    }
);

// Reject withdrawal
router.post('/withdrawals/:requestId/reject',
    [
        body('reason').notEmpty().withMessage('Rejection reason required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { requestId } = req.params;
            const { reason } = req.body;
            const adminId = req.user.id;

            const [result] = await pool.execute(
                `UPDATE withdrawal_requests 
                 SET status = 'rejected', 
                     approved_by = ?,
                     admin_notes = ?
                 WHERE id = ? AND status = 'pending'`,
                [adminId, reason, requestId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Withdrawal request not found'
                });
            }

            res.json({
                success: true,
                message: 'Withdrawal rejected successfully'
            });

        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reject withdrawal'
            });
        }
    }
);

// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        // Get payment transactions
        const [payments] = await pool.execute(`
            SELECT 
                pt.*,
                u.username,
                u.email,
                'payment' as transaction_type
            FROM payment_transactions pt
            JOIN users u ON pt.user_id = u.id
            ORDER BY pt.payment_date DESC
            LIMIT 100
        `);

        // Get fee payments
        const [fees] = await pool.execute(`
            SELECT 
                fp.*,
                u.username,
                u.email,
                'fee' as transaction_type
            FROM fee_payments fp
            JOIN users u ON fp.user_id = u.id
            ORDER BY fp.payment_date DESC
            LIMIT 100
        `);

        // Combine and sort
        const allTransactions = [...payments, ...fees].sort((a, b) => {
            const dateA = new Date(a.payment_date || a.created_at);
            const dateB = new Date(b.payment_date || b.created_at);
            return dateB - dateA;
        }).slice(0, 100);

        res.json({
            success: true,
            data: allTransactions
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});

// Get system settings
router.get('/settings', async (req, res) => {
    try {
        const [settings] = await pool.execute(
            `SELECT * FROM system_settings ORDER BY setting_key`
        );
        
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });
        
        res.json({
            success: true,
            data: {
                settings: settingsObj
            }
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch settings'
        });
    }
});

// Update settings
router.post('/settings/update', async (req, res) => {
    try {
        const updates = req.body;
        
        for (const [key, value] of Object.entries(updates)) {
            await pool.execute(
                `UPDATE system_settings SET setting_value = ? WHERE setting_key = ?`,
                [String(value), key]
            );
        }
        
        res.json({
            success: true,
            message: 'Settings updated successfully'
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update settings'
        });
    }
});

module.exports = router;
