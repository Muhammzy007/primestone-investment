const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const BlockchainVerificationService = require('../services/blockchainVerificationService');
const YieldService = require('../services/yieldService');

const blockchainService = new BlockchainVerificationService();
const yieldService = new YieldService();

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// ==================== DASHBOARD STATS ====================

// Get admin dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        // Get overall statistics
        const [stats] = await pool.execute(
            `SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_users_7d,
                (SELECT COUNT(*) FROM user_investments) as total_investments,
                (SELECT SUM(investment_amount) FROM user_investments WHERE status = 'active') as active_investments_total,
                (SELECT SUM(expected_return) FROM user_investments WHERE status = 'active') as active_expected_return,
                (SELECT COUNT(*) FROM user_investments WHERE status = 'pending_payment') as pending_payments,
                (SELECT COUNT(*) FROM fee_payments WHERE status = 'pending') as pending_fees,
                (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
                (SELECT SUM(amount) FROM payment_transactions WHERE status = 'confirmed') as total_received,
                (SELECT SUM(requested_amount) FROM withdrawal_requests WHERE status = 'completed') as total_paid_out
            `
        );

        // Get recent activities
        const [recentActivities] = await pool.execute(
            `(SELECT 'user' as type, id, username as title, created_at as date FROM users ORDER BY created_at DESC LIMIT 5)
             UNION ALL
             (SELECT 'investment' as type, id, CONCAT('Investment $', investment_amount) as title, created_at as date FROM user_investments ORDER BY created_at DESC LIMIT 5)
             UNION ALL
             (SELECT 'withdrawal' as type, id, CONCAT('Withdrawal $', requested_amount) as title, requested_at as date FROM withdrawal_requests ORDER BY requested_at DESC LIMIT 5)
             ORDER BY date DESC LIMIT 10`
        );

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

// ==================== USER MANAGEMENT ====================

// Get all users with filters
router.get('/users', async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT u.*, 
                   COUNT(DISTINCT ui.id) as total_investments,
                   SUM(CASE WHEN ui.status = 'active' THEN ui.investment_amount ELSE 0 END) as active_investments_total,
                   SUM(CASE WHEN ui.status = 'matured' AND ui.fee_paid = FALSE THEN 1 ELSE 0 END) as pending_fees
            FROM users u
            LEFT JOIN user_investments ui ON u.id = ui.user_id
        `;

        const params = [];

        if (search) {
            query += ` WHERE u.username LIKE ? OR u.email LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.execute(query, params);

        // Get total count for pagination
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

// Get user details
router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [users] = await pool.execute(
            `SELECT u.*, 
                    COUNT(DISTINCT ui.id) as total_investments,
                    SUM(ui.investment_amount) as total_invested,
                    SUM(CASE WHEN ui.status = 'active' THEN ui.current_value ELSE 0 END) as current_value,
                    SUM(CASE WHEN ui.status = 'matured' THEN ui.expected_return ELSE 0 END) as matured_value
             FROM users u
             LEFT JOIN user_investments ui ON u.id = ui.user_id
             WHERE u.id = ?
             GROUP BY u.id`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get user's investments
        const [investments] = await pool.execute(
            `SELECT ui.*, ip.package_name, ip.return_multiplier,
                    ps.paid_amount, ps.remaining_amount
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
             WHERE ui.user_id = ?
             ORDER BY ui.created_at DESC`,
            [userId]
        );

        // Get user's payment transactions
        const [payments] = await pool.execute(
            `SELECT pt.*, cw.chain 
             FROM payment_transactions pt
             JOIN company_wallets cw ON pt.company_wallet_id = cw.id
             WHERE pt.user_id = ?
             ORDER BY pt.payment_date DESC
             LIMIT 20`,
            [userId]
        );

        // Get user's withdrawal requests
        const [withdrawals] = await pool.execute(
            `SELECT wr.*, ui.expected_return
             FROM withdrawal_requests wr
             JOIN user_investments ui ON wr.investment_id = ui.id
             WHERE wr.user_id = ?
             ORDER BY wr.requested_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                user: users[0],
                investments,
                payments,
                withdrawals
            }
        });

    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user details'
        });
    }
});

// Update user status
router.post('/users/:userId/toggle-status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        await pool.execute(
            `UPDATE users SET is_active = ? WHERE id = ?`,
            [isActive, userId]
        );

        // Log admin action
        await pool.execute(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
             VALUES (?, 'toggle_user_status', 'user', ?, ?)`,
            [req.user.id, userId, JSON.stringify({ isActive })]
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

// ==================== WITHDRAWAL MANAGEMENT ====================

// Get pending withdrawals
router.get('/withdrawals/pending', async (req, res) => {
    try {
        const [withdrawals] = await pool.execute(
            `SELECT wr.*, u.username, u.email,
                    ui.investment_amount, ui.expected_return,
                    ui.yield_start_date, ui.maturity_date,
                    fp.payment_method, fp.user_transaction_hash as fee_transaction_hash,
                    fp.confirmation_date as fee_confirmation_date,
                    cw.chain as fee_chain
             FROM withdrawal_requests wr
             JOIN users u ON wr.user_id = u.id
             JOIN user_investments ui ON wr.investment_id = ui.id
             JOIN fee_payments fp ON wr.fee_payment_id = fp.id
             JOIN company_wallets cw ON fp.company_wallet_id = cw.id
             WHERE wr.status = 'pending'
             ORDER BY wr.requested_at ASC`
        );

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

            // Get request details
            const [requests] = await connection.execute(
                `SELECT wr.*, ui.user_id, ui.expected_return
                 FROM withdrawal_requests wr
                 JOIN user_investments ui ON wr.investment_id = ui.id
                 WHERE wr.id = ? AND wr.status = 'pending'`,
                [requestId]
            );

            if (requests.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Withdrawal request not found or already processed'
                });
            }

            const request = requests[0];

            // Generate transaction hash if not provided
            const finalTxHash = transactionHash || `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;

            // Update withdrawal request
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

            // Update investment status
            await connection.execute(
                `UPDATE user_investments 
                 SET status = 'withdrawn',
                     completed_date = NOW()
                 WHERE id = ?`,
                [request.investment_id]
            );

            // Log admin action
            await connection.execute(
                `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
                 VALUES (?, 'approve_withdrawal', 'withdrawal', ?, ?)`,
                [adminId, requestId, JSON.stringify({ amount: request.requested_amount, txHash: finalTxHash })]
            );

            await connection.commit();

            // Send notification to user (you can implement this)
            console.log(`Withdrawal ${requestId} approved for user ${request.user_id}, amount $${request.requested_amount}`);

            res.json({
                success: true,
                message: 'Withdrawal approved successfully',
                data: {
                    requestId,
                    transactionHash: finalTxHash,
                    amount: request.requested_amount
                }
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
                    error: 'Withdrawal request not found or already processed'
                });
            }

            // Log admin action
            await pool.execute(
                `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
                 VALUES (?, 'reject_withdrawal', 'withdrawal', ?, ?)`,
                [adminId, requestId, JSON.stringify({ reason })]
            );

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

// ==================== FEE PAYMENT MANAGEMENT ====================

// Get pending fee payments
router.get('/fees/pending', async (req, res) => {
    try {
        const [fees] = await pool.execute(
            `SELECT fp.*, u.username, u.email,
                    ui.investment_amount, ui.expected_return,
                    cw.chain, cw.wallet_address
             FROM fee_payments fp
             JOIN users u ON fp.user_id = u.id
             JOIN user_investments ui ON fp.investment_id = ui.id
             JOIN company_wallets cw ON fp.company_wallet_id = cw.id
             WHERE fp.status = 'pending'
             ORDER BY fp.payment_date ASC`
        );

        res.json({
            success: true,
            data: fees
        });

    } catch (error) {
        console.error('Error fetching pending fees:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending fees'
        });
    }
});

// Manually confirm fee payment
router.post('/fees/:feeId/confirm',
    [
        body('transactionHash').optional().isString(),
        body('confirmations').optional().isInt()
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
            const { feeId } = req.params;
            const { transactionHash, confirmations, notes } = req.body;
            const adminId = req.user.id;

            await connection.beginTransaction();

            // Get fee payment details
            const [fees] = await connection.execute(
                `SELECT fp.*, ui.user_id
                 FROM fee_payments fp
                 JOIN user_investments ui ON fp.investment_id = ui.id
                 WHERE fp.id = ? AND fp.status = 'pending'`,
                [feeId]
            );

            if (fees.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Fee payment not found or already confirmed'
                });
            }

            const fee = fees[0];

            // Update fee payment
            await connection.execute(
                `UPDATE fee_payments 
                 SET status = 'confirmed', 
                     confirmation_date = NOW(),
                     user_transaction_hash = COALESCE(?, user_transaction_hash),
                     confirmations = COALESCE(?, confirmations),
                     verified_by_admin = TRUE
                 WHERE id = ?`,
                [transactionHash || fee.user_transaction_hash, confirmations || 12, feeId]
            );

            // Update investment
            await connection.execute(
                `UPDATE user_investments 
                 SET fee_paid = TRUE 
                 WHERE id = ?`,
                [fee.investment_id]
            );

            // Log admin action
            await connection.execute(
                `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
                 VALUES (?, 'confirm_fee', 'fee', ?, ?)`,
                [adminId, feeId, JSON.stringify({ transactionHash, confirmations, notes })]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Fee payment confirmed successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error confirming fee:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to confirm fee payment'
            });
        } finally {
            connection.release();
        }
    }
);

// ==================== INVESTMENT MANAGEMENT ====================

// Get all investments with filters
router.get('/investments', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT ui.*, u.username, u.email,
                   ip.package_name,
                   ps.paid_amount, ps.remaining_amount
            FROM user_investments ui
            JOIN users u ON ui.user_id = u.id
            JOIN investment_packages ip ON ui.package_id = ip.id
            LEFT JOIN payment_schedule ps ON ui.id = ps.investment_id
        `;

        const params = [];

        if (status) {
            query += ` WHERE ui.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY ui.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [investments] = await pool.execute(query, params);

        // Get total count
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM user_investments${status ? ' WHERE status = ?' : ''}`,
            status ? [status] : []
        );

        res.json({
            success: true,
            data: {
                investments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching investments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch investments'
        });
    }
});

// Manually trigger yield update
router.post('/investments/update-yields', async (req, res) => {
    try {
        const result = await yieldService.updateAllYields();

        res.json({
            success: true,
            message: 'Yields updated successfully',
            data: result
        });

    } catch (error) {
        console.error('Error updating yields:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update yields'
        });
    }
});

// ==================== PAYMENT TRANSACTIONS ====================

// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT pt.*, u.username, u.email,
                   cw.chain, cw.wallet_address as company_wallet
            FROM payment_transactions pt
            JOIN users u ON pt.user_id = u.id
            JOIN company_wallets cw ON pt.company_wallet_id = cw.id
        `;

        const params = [];
        const conditions = [];

        if (type) {
            conditions.push(`pt.payment_type = ?`);
            params.push(type);
        }

        if (status) {
            conditions.push(`pt.status = ?`);
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` ORDER BY pt.payment_date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [transactions] = await pool.execute(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM payment_transactions pt`;
        if (conditions.length > 0) {
            countQuery += ` WHERE ` + conditions.join(' AND ');
        }
        
        const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});

// ==================== SYSTEM SETTINGS ====================

// Get system settings
router.get('/settings', async (req, res) => {
    try {
        const [settings] = await pool.execute(
            `SELECT * FROM system_settings ORDER BY setting_key`
        );

        // Get company wallets
        const [wallets] = await pool.execute(
            `SELECT * FROM company_wallets`
        );

        res.json({
            success: true,
            data: {
                settings,
                wallets
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

// Update system setting
router.post('/settings/update',
    [
        body('key').notEmpty().withMessage('Setting key required'),
        body('value').notEmpty().withMessage('Setting value required')
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
            const { key, value, description } = req.body;

            await pool.execute(
                `UPDATE system_settings 
                 SET setting_value = ?, description = COALESCE(?, description)
                 WHERE setting_key = ?`,
                [value, description, key]
            );

            // Log admin action
            await pool.execute(
                `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
                 VALUES (?, 'update_setting', 'setting', ?, ?)`,
                [req.user.id, key, JSON.stringify({ key, value })]
            );

            res.json({
                success: true,
                message: 'Setting updated successfully'
            });

        } catch (error) {
            console.error('Error updating setting:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update setting'
            });
        }
    }
);

// Update company wallet
router.post('/wallets/update',
    [
        body('chain').isIn(['TRC20', 'BEP20']).withMessage('Valid chain required'),
        body('walletAddress').notEmpty().withMessage('Wallet address required')
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
            const { chain, walletAddress, tokenContract, description } = req.body;

            await pool.execute(
                `UPDATE company_wallets 
                 SET wallet_address = ?, token_contract = COALESCE(?, token_contract), 
                     description = COALESCE(?, description)
                 WHERE chain = ?`,
                [walletAddress, tokenContract, description, chain]
            );

            // Log admin action
            await pool.execute(
                `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
                 VALUES (?, 'update_wallet', 'wallet', ?, ?)`,
                [req.user.id, chain, JSON.stringify({ chain, walletAddress, tokenContract })]
            );

            res.json({
                success: true,
                message: 'Wallet updated successfully'
            });

        } catch (error) {
            console.error('Error updating wallet:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update wallet'
            });
        }
    }
);

// ==================== ADMIN LOGS ====================

// Get admin action logs
router.get('/logs', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const [logs] = await pool.execute(
            `SELECT al.*, u.username as admin_username
             FROM admin_logs al
             JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM admin_logs`
        );

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch logs'
        });
    }
});

module.exports = router;
