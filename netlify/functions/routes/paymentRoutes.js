const EmailService = require('../services/emailService');
const emailService = new EmailService();
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const QRCode = require('qrcode');
const BlockchainVerificationService = require('../services/blockchainVerificationService');

const blockchainService = new BlockchainVerificationService();


// Get payment history for user
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [payments] = await pool.execute(
            `SELECT * FROM payment_transactions 
             WHERE user_id = ?
             ORDER BY payment_date DESC
             LIMIT 50`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                payments: payments || []
            }
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payment history'
        });
    }
});

// Get payment history for specific investment
router.get('/history/:investmentId', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;
        const userId = req.user.id;

        const [payments] = await pool.execute(
            `SELECT * FROM payment_transactions 
             WHERE investment_id = ? AND user_id = ?
             ORDER BY payment_date DESC`,
            [investmentId, userId]
        );

        res.json({
            success: true,
            data: {
                payments: payments || []
            }
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payment history'
        });
    }
});

// Get pending payments
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [investmentPayments] = await pool.execute(
            `SELECT * FROM payment_transactions 
             WHERE user_id = ? AND status = 'pending'
             ORDER BY payment_date DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                investmentPayments: investmentPayments || [],
                feePayments: []
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

// Initiate investment payment
router.post('/initiate-investment',
    authenticateToken,
    [
        body('investmentId').isInt().withMessage('Valid investment ID required'),
        body('amount').isFloat({ min: 500 }).withMessage('Amount must be at least $500'),
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

            console.log('Initiating payment:', { userId, investmentId, amount, paymentMethod });

            // Verify investment exists and belongs to user
            const [investments] = await pool.execute(
                `SELECT ui.* FROM user_investments ui
                 WHERE ui.id = ? AND ui.user_id = ?`,
                [investmentId, userId]
            );

            if (investments.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Investment not found'
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
                 company_wallet_id, token_contract, status, payment_reference) 
                VALUES (?, ?, ?, 'investment', ?, ?, ?, 'pending', ?)`,
                [userId, investmentId, amount, paymentMethod, wallet.id, wallet.token_contract, paymentReference]
            );

            // Generate QR code
            const qrData = `${paymentMethod.toLowerCase()}:${wallet.wallet_address}?amount=${amount}&reference=${paymentReference}`;
            let qrCode = null;
            try {
                qrCode = await QRCode.toDataURL(qrData);
            } catch (qrError) {
                console.error('QR generation error:', qrError);
            }

            console.log('Payment initiated successfully:', result.insertId);

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
                    instructions: `Send exactly $${amount} USDT (${paymentMethod}) to the address above`
                }
            });

        } catch (error) {
            console.error('Error initiating payment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initiate payment: ' + error.message
            });
        }
    }
);

// Submit transaction hash with validation
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
            const { transactionId, transactionHash } = req.body;
            const userId = req.user.id;

            console.log('Submitting transaction:', { transactionId, transactionHash, userId });

            // First, validate the transaction hash format
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

            // Validate hash format
            if (!blockchainService.validateTransactionHash(transactionHash, transaction.chain)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid ${transaction.chain} transaction hash format`
                });
            }

            // Update with hash
            await pool.execute(
                `UPDATE payment_transactions 
                 SET user_transaction_hash = ?
                 WHERE id = ?`,
                [transactionHash, transactionId]
            );

            // Immediately try to verify
            const verification = await blockchainService.verifyTransaction(transaction, 'payment');

            res.json({
                success: true,
                data: {
                    message: 'Transaction submitted successfully',
                    transactionHash: transactionHash,
                    verification: verification
                }
            });
// Send payment confirmation email
try {
    const [user] = await pool.execute(
        'SELECT email, username FROM users WHERE id = ?',
        [userId]
    );
    if (user.length > 0) {
        await emailService.sendPaymentConfirmation(
            user[0].email,
            user[0].username,
            transaction.amount,
            transaction.investment_id
        );
        console.log(`✅ Payment confirmation email sent to ${user[0].email}`);
    }
} catch (emailErr) {
    console.error('⚠️ Failed to send payment confirmation email:', emailErr.message);
}

        } catch (error) {
            console.error('Error submitting transaction:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit transaction: ' + error.message
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
            const blockchainStatus = await blockchainService.verifyTransaction(transaction, 'payment');

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

module.exports = router;

// Add this at the top of the file with other requires

// Requery transaction (force re-verification)
router.post('/requery/:paymentId', authenticateToken, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        const [payments] = await pool.execute(
            `SELECT pt.*, cw.chain
             FROM payment_transactions pt
             JOIN company_wallets cw ON pt.company_wallet_id = cw.id
             WHERE pt.id = ? AND pt.user_id = ?`,
            [paymentId, userId]
        );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        const payment = payments[0];
        
        if (!payment.user_transaction_hash) {
            return res.status(400).json({
                success: false,
                error: 'No transaction hash to verify'
            });
        }

        // Force re-verification on blockchain
        const verification = await blockchainService.verifyTransaction(payment, 'payment');

        if (verification.verified) {
            // Update payment status
            await pool.execute(
                `UPDATE payment_transactions 
                 SET status = 'confirmed', 
                     confirmation_date = NOW(),
                     confirmations = ?,
                     from_address = ?,
                     to_address = ?
                 WHERE id = ?`,
                [verification.confirmations, verification.fromAddress, verification.toAddress, payment.id]
            );

            res.json({
                success: true,
                message: 'Transaction verified successfully',
                data: verification
            });
        } else {
            res.json({
                success: false,
                error: verification.error || 'Verification failed',
                code: verification.code
            });
        }
    } catch (error) {
        console.error('Error re-verifying transaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to re-verify transaction'
        });
    }
});
