const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const YieldService = require('../services/yieldService');

const yieldService = new YieldService();

// Check withdrawal eligibility - THIS IS THE KEY FUNCTION
router.get('/check-eligibility/:investmentId', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const userId = req.user.id;

        // Get investment details with package info
        const [investment] = await pool.execute(
            `SELECT ui.*, ip.package_name, ip.yield_rate,
                    DATEDIFF(NOW(), ui.yield_start_date) as days_active
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

        const inv = investment[0];
        
        // Calculate expected final value
        const expectedFinalValue = yieldService.calculateFinalValue(
            parseFloat(inv.investment_amount),
            parseFloat(inv.yield_rate)
        );

        // Check eligibility criteria:
        // 1. Status must be 'completed' (180 days passed)
        // 2. Current value must be at expected amount
        
        let isEligible = false;
        let message = '';
        
        if (inv.status !== 'completed') {
            // Calculate days remaining
            const daysActive = parseInt(inv.days_active || 0);
            const daysRemaining = 180 - daysActive;
            
            message = `You are not eligible to request withdrawal yet. `;
            message += `Your investment needs ${daysRemaining} more days to mature. `;
            message += `Current value: $${parseFloat(inv.current_value || inv.investment_amount).toFixed(2)} / Expected: $${expectedFinalValue.toFixed(2)}`;
            
        } else if (parseFloat(inv.current_value) < expectedFinalValue * 0.99) { // Allow 1% margin for rounding
            message = `Your investment has not reached the full expected value yet. `;
            message += `Current: $${parseFloat(inv.current_value).toFixed(2)} / Expected: $${expectedFinalValue.toFixed(2)}`;
            
        } else {
            isEligible = true;
            message = 'You are eligible to request withdrawal';
        }

        // Check if fee is already paid
        const [feePaid] = await pool.execute(
            `SELECT * FROM fee_payments 
             WHERE investment_id = ? AND status = 'confirmed'`,
            [investmentId]
        );

        res.json({
            success: true,
            data: {
                isEligible,
                message,
                investmentId: inv.id,
                packageName: inv.package_name,
                initialAmount: inv.investment_amount,
                currentValue: inv.current_value || inv.investment_amount,
                expectedValue: expectedFinalValue,
                status: inv.status,
                daysActive: inv.days_active || 0,
                daysRemaining: inv.status === 'completed' ? 0 : 180 - (inv.days_active || 0),
                feePaid: feePaid.length > 0,
                showWithdrawButton: isEligible && feePaid.length === 0,
                showFeeModal: isEligible && feePaid.length === 0,
                canSubmitRequest: isEligible && feePaid.length > 0
            }
        });

    } catch (error) {
        console.error('Error checking withdrawal eligibility:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check withdrawal eligibility'
        });
    }
});

// Get withdrawal fee status
router.get('/fee-status/:investmentId', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const userId = req.user.id;

        const [feePayments] = await pool.execute(
            `SELECT fp.*, cw.chain, cw.wallet_address
             FROM fee_payments fp
             JOIN company_wallets cw ON fp.company_wallet_id = cw.id
             WHERE fp.investment_id = ? AND fp.user_id = ?
             ORDER BY fp.payment_date DESC
             LIMIT 1`,
            [investmentId, userId]
        );

        if (feePayments.length === 0) {
            return res.json({
                success: true,
                data: {
                    feePaid: false,
                    noPayment: true
                }
            });
        }

        const fee = feePayments[0];

        res.json({
            success: true,
            data: {
                feePaid: fee.status === 'confirmed',
                feePending: fee.status === 'pending',
                feeFailed: fee.status === 'failed',
                paymentMethod: fee.payment_method,
                amount: fee.amount,
                transactionHash: fee.user_transaction_hash,
                paymentDate: fee.payment_date,
                confirmationDate: fee.confirmation_date,
                status: fee.status,
                confirmations: fee.confirmations
            }
        });

    } catch (error) {
        console.error('Error checking fee status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check fee status'
        });
    }
});

// Submit withdrawal request (only if eligible)
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

            // First check if investment is eligible for withdrawal
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
                    error: 'Investment not eligible for withdrawal. Must be fully matured (180 days).'
                });
            }

            const inv = investment[0];
            
            // Verify fee is paid
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
                    inv.expected_return,
                    walletAddress,
                    walletChain
                ]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                data: {
                    requestId: result.insertId,
                    amount: inv.expected_return,
                    walletAddress: walletAddress,
                    walletChain: walletChain,
                    status: 'pending',
                    message: 'Withdrawal request submitted successfully. Pending admin approval.',
                    estimatedProcessingTime: '24-48 hours'
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

// Get withdrawal request status
router.get('/request-status/:investmentId', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const userId = req.user.id;

        const [requests] = await pool.execute(
            `SELECT wr.*, u.username, u.email,
                    ui.investment_amount, ui.expected_return,
                    fp.amount as fee_amount, fp.payment_method,
                    fp.confirmation_date as fee_confirmation_date
             FROM withdrawal_requests wr
             JOIN user_investments ui ON wr.investment_id = ui.id
             JOIN fee_payments fp ON wr.fee_payment_id = fp.id
             JOIN users u ON wr.user_id = u.id
             WHERE wr.investment_id = ? AND wr.user_id = ?
             ORDER BY wr.requested_at DESC
             LIMIT 1`,
            [investmentId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No withdrawal request found'
            });
        }

        const request = requests[0];

        res.json({
            success: true,
            data: {
                requestId: request.id,
                amount: request.requested_amount,
                status: request.status,
                requestedAt: request.requested_at,
                approvedAt: request.approved_at,
                completedAt: request.completed_at,
                walletAddress: request.user_wallet_address,
                walletChain: request.user_wallet_chain,
                transactionHash: request.company_transaction_hash,
                adminNotes: request.admin_notes,
                feeDetails: {
                    amount: request.fee_amount,
                    method: request.payment_method,
                    confirmedAt: request.fee_confirmation_date
                },
                investment: {
                    amount: request.investment_amount,
                    expectedReturn: request.expected_return
                }
            }
        });

    } catch (error) {
        console.error('Error fetching withdrawal request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch withdrawal request'
        });
    }
});

// Get user's withdrawal history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [requests] = await pool.execute(
            `SELECT wr.*, ui.investment_amount, ui.expected_return,
                    ip.package_name
             FROM withdrawal_requests wr
             JOIN user_investments ui ON wr.investment_id = ui.id
             JOIN investment_packages ip ON ui.package_id = ip.id
             WHERE wr.user_id = ?
             ORDER BY wr.requested_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching withdrawal history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch withdrawal history'
        });
    }
});

// Cancel withdrawal request (if pending)
router.post('/cancel-request/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const [result] = await pool.execute(
            `UPDATE withdrawal_requests 
             SET status = 'rejected', 
                 admin_notes = 'Cancelled by user'
             WHERE id = ? AND user_id = ? AND status = 'pending'`,
            [requestId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                error: 'Request not found or cannot be cancelled'
            });
        }

        res.json({
            success: true,
            message: 'Withdrawal request cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling withdrawal request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel withdrawal request'
        });
    }
});

// Get withdrawal fee amount
router.get('/fee-amount', async (req, res) => {
    try {
        const [setting] = await pool.execute(
            `SELECT setting_value FROM system_settings WHERE setting_key = 'withdrawal_fee'`
        );

        res.json({
            success: true,
            data: {
                feeAmount: parseFloat(setting[0]?.setting_value || 500),
                currency: 'USD'
            }
        });

    } catch (error) {
        console.error('Error fetching fee amount:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch fee amount'
        });
    }
});

module.exports = router;
