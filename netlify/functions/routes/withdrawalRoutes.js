const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user's withdrawal history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [withdrawals] = await pool.execute(
            `SELECT wr.*, 
                    ip.package_name,
                    ui.investment_amount,
                    ui.expected_return,
                    fp.amount as fee_amount,
                    fp.status as fee_status
             FROM withdrawal_requests wr
             JOIN user_investments ui ON wr.investment_id = ui.id
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN fee_payments fp ON wr.fee_payment_id = fp.id
             WHERE wr.user_id = ?
             ORDER BY wr.requested_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: withdrawals
        });

    } catch (error) {
        console.error('Error fetching withdrawal history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch withdrawal history'
        });
    }
});

// Get single withdrawal request
router.get('/request/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [requests] = await pool.execute(
            `SELECT wr.*, 
                    u.username, u.email,
                    ui.investment_amount, ui.expected_return,
                    ip.package_name, ip.yield_rate,
                    fp.amount as fee_amount,
                    fp.payment_method as fee_payment_method,
                    fp.status as fee_status,
                    fp.confirmation_date as fee_confirmation_date,
                    fp.user_transaction_hash as fee_transaction_hash
             FROM withdrawal_requests wr
             JOIN users u ON wr.user_id = u.id
             JOIN user_investments ui ON wr.investment_id = ui.id
             JOIN investment_packages ip ON ui.package_id = ip.id
             LEFT JOIN fee_payments fp ON wr.fee_payment_id = fp.id
             WHERE wr.id = ? AND (wr.user_id = ? OR ? = 'admin')`,
            [id, userId, req.user.role]
        );
        
        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Withdrawal request not found'
            });
        }

        res.json({
            success: true,
            data: requests[0]
        });

    } catch (error) {
        console.error('Error fetching withdrawal request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch withdrawal request'
        });
    }
});

// Submit withdrawal request
router.post('/submit-request',
    authenticateToken,
    [
        body('investmentId').isInt().withMessage('Valid investment ID required'),
        body('walletAddress').notEmpty().withMessage('Wallet address required'),
        body('walletChain').isIn(['TRC20', 'BEP20']).withMessage('Valid wallet chain required')
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
            const { investmentId, walletAddress, walletChain } = req.body;
            const userId = req.user.id;

            await connection.beginTransaction();

            // Check if investment is eligible
            const [investment] = await connection.execute(
                `SELECT ui.*, ip.yield_rate
                 FROM user_investments ui
                 JOIN investment_packages ip ON ui.package_id = ip.id
                 WHERE ui.id = ? AND ui.user_id = ? AND ui.status = 'completed'`,
                [investmentId, userId]
            );

            if (investment.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'Investment not eligible for withdrawal'
                });
            }

            // Check if fee is paid
            const [feePayments] = await connection.execute(
                `SELECT id FROM fee_payments 
                 WHERE investment_id = ? AND user_id = ? AND status = 'confirmed'
                 ORDER BY id DESC LIMIT 1`,
                [investmentId, userId]
            );

            if (feePayments.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'Withdrawal fee must be paid before requesting withdrawal'
                });
            }

            // Check if request already exists
            const [existing] = await connection.execute(
                `SELECT id FROM withdrawal_requests 
                 WHERE investment_id = ? AND status IN ('pending', 'approved')`,
                [investmentId]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'Withdrawal request already exists for this investment'
                });
            }

            // Create withdrawal request
            const [result] = await connection.execute(
                `INSERT INTO withdrawal_requests 
                (user_id, investment_id, fee_payment_id, requested_amount, 
                 user_wallet_address, user_wallet_chain, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    userId, 
                    investmentId, 
                    feePayments[0].id,
                    investment[0].expected_return,
                    walletAddress,
                    walletChain
                ]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                data: {
                    requestId: result.insertId,
                    amount: investment[0].expected_return,
                    walletAddress: walletAddress,
                    walletChain: walletChain,
                    status: 'pending',
                    message: 'Withdrawal request submitted successfully'
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error submitting withdrawal request:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit withdrawal request'
            });
        } finally {
            connection.release();
        }
    }
);

module.exports = router;
