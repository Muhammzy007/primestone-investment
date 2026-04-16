const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const crypto = require('crypto');

// Webhook for TronGrid transaction confirmations
router.post('/tron', async (req, res) => {
    try {
        const { txID, contractRet, blockNumber, from, to, value } = req.body;
        console.log('Tron webhook received:', { txID, contractRet, blockNumber });

        // Update transaction status in database
        await pool.execute(
            `UPDATE payment_transactions 
             SET status = 'confirmed', 
                 confirmation_date = NOW(),
                 blockchain_data = ?
             WHERE user_transaction_hash = ?`,
            [JSON.stringify(req.body), txID]
        );

        // Check if this is a fee payment
        await pool.execute(
            `UPDATE fee_payments 
             SET status = 'confirmed', 
                 confirmation_date = NOW(),
                 blockchain_data = ?
             WHERE user_transaction_hash = ?`,
            [JSON.stringify(req.body), txID]
        );

        // Get the transaction to find investment ID
        const [transactions] = await pool.execute(
            `SELECT * FROM payment_transactions WHERE user_transaction_hash = ?`,
            [txID]
        );

        if (transactions.length > 0) {
            const tx = transactions[0];
            
            // Update payment schedule
            await pool.execute(
                `UPDATE payment_schedule 
                 SET paid_amount = paid_amount + ?,
                     remaining_amount = remaining_amount - ?,
                     last_payment_date = NOW()
                 WHERE investment_id = ?`,
                [tx.amount, tx.amount, tx.investment_id]
            );

            // Check if investment is fully paid
            const [schedule] = await pool.execute(
                `SELECT * FROM payment_schedule WHERE investment_id = ?`,
                [tx.investment_id]
            );

            if (schedule[0].remaining_amount <= 0) {
                // Activate investment
                await pool.execute(
                    `UPDATE user_investments 
                     SET status = 'active',
                         yield_start_date = NOW(),
                         maturity_date = DATE_ADD(NOW(), INTERVAL 180 DAY)
                     WHERE id = ?`,
                    [tx.investment_id]
                );
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Tron webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook for BSCScan transaction confirmations
router.post('/bsc', async (req, res) => {
    try {
        const { txHash, status, blockNumber, from, to, value } = req.body;
        console.log('BSC webhook received:', { txHash, status, blockNumber });

        // Update transaction status in database
        await pool.execute(
            `UPDATE payment_transactions 
             SET status = 'confirmed', 
                 confirmation_date = NOW(),
                 blockchain_data = ?
             WHERE user_transaction_hash = ?`,
            [JSON.stringify(req.body), txHash]
        );

        // Check if this is a fee payment
        await pool.execute(
            `UPDATE fee_payments 
             SET status = 'confirmed', 
                 confirmation_date = NOW(),
                 blockchain_data = ?
             WHERE user_transaction_hash = ?`,
            [JSON.stringify(req.body), txHash]
        );

        // Get the transaction to find investment ID
        const [transactions] = await pool.execute(
            `SELECT * FROM payment_transactions WHERE user_transaction_hash = ?`,
            [txHash]
        );

        if (transactions.length > 0) {
            const tx = transactions[0];
            
            // Update payment schedule
            await pool.execute(
                `UPDATE payment_schedule 
                 SET paid_amount = paid_amount + ?,
                     remaining_amount = remaining_amount - ?,
                     last_payment_date = NOW()
                 WHERE investment_id = ?`,
                [tx.amount, tx.amount, tx.investment_id]
            );

            // Check if investment is fully paid
            const [schedule] = await pool.execute(
                `SELECT * FROM payment_schedule WHERE investment_id = ?`,
                [tx.investment_id]
            );

            if (schedule[0].remaining_amount <= 0) {
                // Activate investment
                await pool.execute(
                    `UPDATE user_investments 
                     SET status = 'active',
                         yield_start_date = NOW(),
                         maturity_date = DATE_ADD(NOW(), INTERVAL 180 DAY)
                     WHERE id = ?`,
                    [tx.investment_id]
                );
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('BSC webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Webhook routes are working' });
});

module.exports = router;
