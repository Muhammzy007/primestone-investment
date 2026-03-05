const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const BlockchainVerificationService = require('../services/blockchainVerificationService');

const blockchainService = new BlockchainVerificationService();

// Get company wallet addresses
router.get('/wallet-addresses', async (req, res) => {
    try {
        const [wallets] = await pool.execute(
            `SELECT chain, wallet_address, token_contract, description 
             FROM company_wallets WHERE is_active = TRUE`
        );

        res.json({
            success: true,
            data: wallets
        });
    } catch (error) {
        console.error('Error fetching wallet addresses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch wallet addresses'
        });
    }
});

// Initialize investment payment
router.post('/initiate-investment',
    authenticateToken,
    [
        body('investmentId').isInt().withMessage('Valid investment ID required'),
        body('amount').isFloat({ min: 50 }).withMessage('Amount must be at least $50'),
        body('paymentMethod').isIn(['TRC20', 'BEP20']).withMessage('Valid payment method required')
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
            const { investmentId, amount, paymentMethod } = req.body;
            const userId = req.user.id;

            // Verify investment belongs to user and is pending payment
            const [investments] = await pool.execute(
                `SELECT ui.*, ps.remaining_amount 
                 FROM user_investments ui
                 JOIN payment_schedule ps ON ui.id = ps.investment_id
                 WHERE ui.id = ? AND ui.user_id = ? AND ui.status = 'pending_payment'`,
                [investmentId, userId]
            );

            if (investments.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Investment not found or not eligible for payment'
                });
            }

            const investment = investments[0];

            if (amount > investment.remaining_amount) {
                return res.status(400).json({
                    success: false,
                    error: `Payment amount cannot exceed remaining balance of $${investment.remaining_amount}`
                });
            }

            // Get company wallet
            const [wallets] = await pool.execute(
                `SELECT * FROM company_wallets WHERE chain = ? AND is_active = TRUE`,
                [paymentMethod]
            );

            if (wallets.length === 0) {
                return res.status(500).json({
                    success: false,
                    error: 'No active wallet found for selected payment method'
                });
            }

            const wallet = wallets[0];
            const paymentReference = blockchainService.generatePaymentReference(userId, investmentId);

            // Create payment transaction
            const [result] = await pool.execute(
                `INSERT INTO payment_transactions 
                (user_id, investment_id, amount, payment_type, payment_method, 
                 company_wallet_id, token_contract, status) 
                VALUES (?, ?, ?, 'investment', ?, ?, ?, 'pending')`,
                [userId, investmentId, amount, paymentMethod, wallet.id, wallet.token_contract]
            );

            // Generate QR code
            const qrData = blockchainService.generatePaymentQR(amount, paymentMethod, paymentReference);
            const qrCode = await QRCode.toDataURL(qrData);

            res.json({
                success: true,
                data: {
                    transactionId: result.insertId,
                    paymentReference: paymentReference,
                    amount: amount,
                    walletAddress: wallet.wallet_address,
                    tokenContract: wallet.token_contract,
                    paymentMethod: paymentMethod,
                    qrCode: qrCode,
                    remainingBalance: investment.remaining_amount - amount,
                    instructions: `Send exactly $${amount} USDT (${paymentMethod}) to the address above`
                }
            });

        } catch (error) {
            console.error('Error initiating payment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initiate payment'
            });
        }
    }
);

// Submit transaction hash
router.post('/submit-transaction',
    authenticateToken,
    [
        body('transactionId').isInt().withMessage('Valid transaction ID required'),
        body('transactionHash').notEmpty().withMessage('Transaction hash required')
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
            const { transactionId, transactionHash, fromAddress } = req.body;
            const userId = req.user.id;

            // Verify transaction belongs to user
            const [transactions] = await pool.execute(
                `SELECT pt.*, cw.chain 
                 FROM payment_transactions pt
                 JOIN company_wallets cw ON pt.company_wallet_id = cw.id
                 WHERE pt.id = ? AND pt.user_id = ? AND pt.status = 'pending'`,
                [transactionId, userId]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found or already processed'
                });
            }

            const transaction = transactions[0];

            if (!blockchainService.validateTransactionHash(transactionHash, transaction.chain)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid transaction hash format'
                });
            }

            await pool.execute(
                `UPDATE payment_transactions 
                 SET user_transaction_hash = ?, from_address = ?
                 WHERE id = ?`,
                [transactionHash, fromAddress || null, transactionId]
            );

            // Initial verification check
            const verification = await blockchainService.getTransactionStatus(
                transactionHash, 
                transaction.chain
            );

            res.json({
                success: true,
                data: {
                    message: 'Transaction submitted successfully. Verification in progress.',
                    transactionHash: transactionHash,
                    status: verification.status,
                    confirmations: verification.confirmations || 0,
                    requiredConfirmations: verification.requiredConfirmations || 12
                }
            });

        } catch (error) {
            console.error('Error submitting transaction:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit transaction'
            });
        }
    }
);

// Get transaction status
router.get('/transaction-status/:transactionHash',
    authenticateToken,
    async (req, res) => {
        try {
            const { transactionHash } = req.params;
            const userId = req.user.id;

            const [transactions] = await pool.execute(
                `SELECT pt.*, cw.chain 
                 FROM payment_transactions pt
                 JOIN company_wallets cw ON pt.company_wallet_id = cw.id
                 WHERE pt.user_transaction_hash = ? AND pt.user_id = ?`,
                [transactionHash, userId]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found'
                });
            }

            const transaction = transactions[0];
            const blockchainStatus = await blockchainService.getTransactionStatus(
                transactionHash,
                transaction.chain
            );

            res.json({
                success: true,
                data: {
                    database: {
                        status: transaction.status,
                        amount: transaction.amount,
                        paymentDate: transaction.payment_date,
                        confirmationDate: transaction.confirmation_date
                    },
                    blockchain: blockchainStatus
                }
            });

        } catch (error) {
            console.error('Error checking transaction status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check transaction status'
            });
        }
    }
);

// Get payment history for investment
router.get('/history/:investmentId',
    authenticateToken,
    async (req, res) => {
        try {
            const { investmentId } = req.params;
            const userId = req.user.id;

            const [payments] = await pool.execute(
                `SELECT pt.*, cw.chain 
                 FROM payment_transactions pt
                 JOIN company_wallets cw ON pt.company_wallet_id = cw.id
                 WHERE pt.investment_id = ? AND pt.user_id = ?
                 ORDER BY pt.payment_date DESC`,
                [investmentId, userId]
            );

            const [schedule] = await pool.execute(
                `SELECT * FROM payment_schedule 
                 WHERE investment_id = ? AND user_id = ?`,
                [investmentId, userId]
            );

            res.json({
                success: true,
                data: {
                    payments: payments,
                    schedule: schedule[0] || null
                }
            });

        } catch (error) {
            console.error('Error fetching payment history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch payment history'
            });
        }
    }
);

// Initiate withdrawal fee payment
router.post('/initiate-fee',
    authenticateToken,
    [
        body('investmentId').isInt().withMessage('Valid investment ID required'),
        body('paymentMethod').isIn(['TRC20', 'BEP20']).withMessage('Valid payment method required')
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
            const { investmentId, paymentMethod } = req.body;
            const userId = req.user.id;

            const [investments] = await pool.execute(
                `SELECT * FROM user_investments 
                 WHERE id = ? AND user_id = ? AND status = 'completed' AND fee_paid = FALSE`,
                [investmentId, userId]
            );

            if (investments.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Investment not found, not completed, or fee already paid'
                });
            }

            const [existingFee] = await pool.execute(
                `SELECT * FROM fee_payments 
                 WHERE investment_id = ? AND status = 'pending'`,
                [investmentId]
            );

            if (existingFee.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Fee payment already pending for this investment'
                });
            }

            const [wallets] = await pool.execute(
                `SELECT * FROM company_wallets WHERE chain = ? AND is_active = TRUE`,
                [paymentMethod]
            );

            if (wallets.length === 0) {
                return res.status(500).json({
                    success: false,
                    error: 'No active wallet found for selected payment method'
                });
            }

            const wallet = wallets[0];

            const [result] = await pool.execute(
                `INSERT INTO fee_payments 
                (user_id, investment_id, amount, payment_method, company_wallet_id, token_contract, status) 
                VALUES (?, ?, 500.00, ?, ?, ?, 'pending')`,
                [userId, investmentId, paymentMethod, wallet.id, wallet.token_contract]
            );

            await pool.execute(
                `UPDATE user_investments SET fee_payment_id = ? WHERE id = ?`,
                [result.insertId, investmentId]
            );

            const qrData = blockchainService.generatePaymentQR(500, paymentMethod, `FEE-${investmentId}`);
            const qrCode = await QRCode.toDataURL(qrData);

            res.json({
                success: true,
                data: {
                    feePaymentId: result.insertId,
                    amount: 500,
                    walletAddress: wallet.wallet_address,
                    tokenContract: wallet.token_contract,
                    paymentMethod: paymentMethod,
                    qrCode: qrCode,
                    instructions: `Send exactly $500 USDT (${paymentMethod}) as withdrawal fee`
                }
            });

        } catch (error) {
            console.error('Error initiating fee payment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initiate fee payment'
            });
        }
    }
);

// Submit fee transaction
router.post('/submit-fee-transaction',
    authenticateToken,
    [
        body('feePaymentId').isInt().withMessage('Valid fee payment ID required'),
        body('transactionHash').notEmpty().withMessage('Transaction hash required')
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
            const { feePaymentId, transactionHash, fromAddress } = req.body;
            const userId = req.user.id;

            const [feePayments] = await pool.execute(
                `SELECT fp.*, cw.chain 
                 FROM fee_payments fp
                 JOIN company_wallets cw ON fp.company_wallet_id = cw.id
                 WHERE fp.id = ? AND fp.user_id = ? AND fp.status = 'pending'`,
                [feePaymentId, userId]
            );

            if (feePayments.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Fee payment not found or already processed'
                });
            }

            const feePayment = feePayments[0];

            if (!blockchainService.validateTransactionHash(transactionHash, feePayment.chain)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid transaction hash format'
                });
            }

            await pool.execute(
                `UPDATE fee_payments 
                 SET user_transaction_hash = ?, from_address = ?
                 WHERE id = ?`,
                [transactionHash, fromAddress || null, feePaymentId]
            );

            const verification = await blockchainService.getTransactionStatus(
                transactionHash,
                feePayment.chain
            );

            res.json({
                success: true,
                data: {
                    message: 'Fee payment submitted successfully. Verification in progress.',
                    transactionHash: transactionHash,
                    status: verification.status,
                    confirmations: verification.confirmations || 0,
                    requiredConfirmations: verification.requiredConfirmations || 12
                }
            });

        } catch (error) {
            console.error('Error submitting fee transaction:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit fee transaction'
            });
        }
    }
);

// Get pending payments
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [pendingInvestments] = await pool.execute(
            `SELECT pt.*, cw.chain, ui.investment_amount, ui.expected_return
             FROM payment_transactions pt
             JOIN company_wallets cw ON pt.company_wallet_id = cw.id
             JOIN user_investments ui ON pt.investment_id = ui.id
             WHERE pt.user_id = ? AND pt.status = 'pending'
             ORDER BY pt.payment_date DESC`,
            [userId]
        );

        const [pendingFees] = await pool.execute(
            `SELECT fp.*, cw.chain, ui.investment_amount, ui.expected_return
             FROM fee_payments fp
             JOIN company_wallets cw ON fp.company_wallet_id = cw.id
             JOIN user_investments ui ON fp.investment_id = ui.id
             WHERE fp.user_id = ? AND fp.status = 'pending'
             ORDER BY fp.payment_date DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                investmentPayments: pendingInvestments,
                feePayments: pendingFees
            }
        });

    } catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending payments'
        });
    }
});

// Helper function to generate payment reference
function generatePaymentReference(userId, investmentId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PS-${userId}-${investmentId}-${timestamp}-${random}`.toUpperCase();
}

module.exports = router;
