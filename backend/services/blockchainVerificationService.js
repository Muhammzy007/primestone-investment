const axios = require('axios');
const pool = require('../config/database');
const crypto = require('crypto');

class BlockchainVerificationService {
    constructor() {
        this.tronGridApiKey = process.env.TRON_GRID_API_KEY;
        this.bscscanApiKey = process.env.BSCSCAN_API_KEY;
        this.tronGridUrl = process.env.TRON_GRID_URL || 'https://api.trongrid.io';
        this.bscscanUrl = process.env.BSCSCAN_URL || 'https://api.bscscan.com/api';
        this.requiredConfirmations = process.env.REQUIRED_CONFIRMATIONS || 12;
        
        // Contract addresses
        this.trc20UsdtContract = process.env.USDT_TRC20_CONTRACT;
        this.bep20UsdtContract = process.env.USDT_BEP20_CONTRACT;
        
        // Company wallet addresses
        this.trc20Address = process.env.TRC20_ADDRESS;
        this.bep20Address = process.env.BEP20_ADDRESS;
    }

    // Verify TRC20 USDT transaction
    async verifyTRC20Transaction(transactionHash) {
        try {
            console.log(`🔍 Verifying TRC20 transaction: ${transactionHash}`);
            
            const response = await axios.get(
                `${this.tronGridUrl}/v1/transactions/${transactionHash}`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': this.tronGridApiKey
                    }
                }
            );

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                return {
                    verified: false,
                    error: 'Transaction not found'
                };
            }

            const tx = response.data.data[0];
            
            // Check if it's a USDT transfer
            const isUsdtTransfer = tx.raw_data.contract[0].parameter.value.contract_address === 
                                   this.trc20UsdtContract;
            
            if (!isUsdtTransfer) {
                return {
                    verified: false,
                    error: 'Not a USDT transaction'
                };
            }

            // Parse the transfer data
            const contractData = tx.raw_data.contract[0].parameter.value;
            const amount = this.parseTRC20Amount(contractData.data);
            const toAddress = contractData.to_address;
            const fromAddress = contractData.owner_address;
            
            // Verify it's sent to our company wallet
            if (toAddress !== this.trc20Address) {
                return {
                    verified: false,
                    error: 'Recipient address does not match company wallet'
                };
            }

            // Get transaction info for confirmations
            const txInfoResponse = await axios.get(
                `${this.tronGridUrl}/v1/transactions/${transactionHash}/info`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': this.tronGridApiKey
                    }
                }
            );

            const confirmations = txInfoResponse.data.data[0]?.blockNumber ? 
                await this.getTRC20Confirmations(txInfoResponse.data.data[0].blockNumber) : 0;

            return {
                verified: true,
                transactionHash: transactionHash,
                fromAddress: fromAddress,
                toAddress: toAddress,
                amount: amount,
                confirmations: confirmations,
                blockNumber: txInfoResponse.data.data[0]?.blockNumber,
                timestamp: tx.block_timestamp,
                chain: 'TRC20'
            };

        } catch (error) {
            console.error('TRC20 verification error:', error.message);
            return {
                verified: false,
                error: error.message
            };
        }
    }

    // Verify BEP20 USDT transaction via BSCScan
    async verifyBEP20Transaction(transactionHash) {
        try {
            console.log(`🔍 Verifying BEP20 transaction: ${transactionHash}`);
            
            const response = await axios.get(this.bscscanUrl, {
                params: {
                    module: 'account',
                    action: 'tokentx',
                    txhash: transactionHash,
                    apikey: this.bscscanApiKey
                }
            });

            if (response.data.status !== '1' || !response.data.result || response.data.result.length === 0) {
                return {
                    verified: false,
                    error: response.data.message || 'Transaction not found'
                };
            }

            const tx = response.data.result[0];
            
            // Verify it's USDT and sent to our wallet
            if (tx.contractAddress.toLowerCase() !== this.bep20UsdtContract.toLowerCase()) {
                return {
                    verified: false,
                    error: 'Not a USDT transaction'
                };
            }

            if (tx.to.toLowerCase() !== this.bep20Address.toLowerCase()) {
                return {
                    verified: false,
                    error: 'Recipient address does not match company wallet'
                };
            }

            // Get transaction receipt for confirmations
            const receiptResponse = await axios.get(this.bscscanUrl, {
                params: {
                    module: 'transaction',
                    action: 'gettxreceiptstatus',
                    txhash: transactionHash,
                    apikey: this.bscscanApiKey
                }
            });

            // Get current block number for confirmations
            const blockResponse = await axios.get(this.bscscanUrl, {
                params: {
                    module: 'block',
                    action: 'getblocknobytime',
                    timestamp: Math.floor(Date.now() / 1000),
                    closest: 'before',
                    apikey: this.bscscanApiKey
                }
            });

            const currentBlock = parseInt(blockResponse.data.result);
            const txBlock = parseInt(tx.blockNumber);
            const confirmations = currentBlock - txBlock;

            return {
                verified: true,
                transactionHash: transactionHash,
                fromAddress: tx.from,
                toAddress: tx.to,
                amount: this.parseBEP20Amount(tx.value, tx.tokenDecimal),
                confirmations: confirmations,
                blockNumber: tx.blockNumber,
                timestamp: tx.timeStamp * 1000,
                chain: 'BEP20'
            };

        } catch (error) {
            console.error('BEP20 verification error:', error.message);
            return {
                verified: false,
                error: error.message
            };
        }
    }

    // Parse TRC20 amount from hex data
    parseTRC20Amount(hexData) {
        // USDT transfer data is usually 68 bytes (0x + 68 chars)
        // The amount is the last 64 chars after the method ID
        const amountHex = hexData.substring(hexData.length - 64);
        const amountWei = BigInt('0x' + amountHex);
        // USDT has 6 decimals on TRC20
        return Number(amountWei) / 1_000_000;
    }

    // Parse BEP20 amount
    parseBEP20Amount(value, decimals) {
        return Number(value) / Math.pow(10, parseInt(decimals));
    }

    // Get TRC20 confirmations
    async getTRC20Confirmations(blockNumber) {
        try {
            const response = await axios.get(
                `${this.tronGridUrl}/v1/blocks/${blockNumber}`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': this.tronGridApiKey
                    }
                }
            );

            const currentBlockResponse = await axios.get(
                `${this.tronGridUrl}/v1/blocks/latest`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': this.tronGridApiKey
                    }
                }
            );

            const currentBlock = currentBlockResponse.data.block_header.raw_data.number;
            return currentBlock - blockNumber;
        } catch (error) {
            console.error('Error getting TRC20 confirmations:', error.message);
            return 0;
        }
    }

    // Verify all pending transactions
    async verifyAllPendingTransactions() {
        try {
            // Get pending payment transactions
            const [pendingPayments] = await pool.execute(
                `SELECT pt.*, cw.chain, cw.wallet_address 
                 FROM payment_transactions pt
                 JOIN company_wallets cw ON pt.company_wallet_id = cw.id
                 WHERE pt.status = 'pending' 
                 AND pt.payment_date > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
            );

            // Get pending fee payments
            const [pendingFees] = await pool.execute(
                `SELECT fp.*, cw.chain, cw.wallet_address 
                 FROM fee_payments fp
                 JOIN company_wallets cw ON fp.company_wallet_id = cw.id
                 WHERE fp.status = 'pending'
                 AND fp.payment_date > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
            );

            console.log(`Found ${pendingPayments.length} pending payment transactions`);
            console.log(`Found ${pendingFees.length} pending fee payments`);

            // Verify each pending transaction
            for (const payment of pendingPayments) {
                await this.verifyTransaction(payment, 'payment');
            }

            for (const fee of pendingFees) {
                await this.verifyTransaction(fee, 'fee');
            }

        } catch (error) {
            console.error('Error verifying pending transactions:', error.message);
        }
    }

    // Verify a specific transaction
    async verifyTransaction(record, type) {
        try {
            let verification;
            
            if (record.chain === 'TRC20') {
                verification = await this.verifyTRC20Transaction(record.user_transaction_hash);
            } else {
                verification = await this.verifyBEP20Transaction(record.user_transaction_hash);
            }

            // Log verification attempt
            await pool.execute(
                `INSERT INTO blockchain_verifications 
                (transaction_hash, chain, verification_type, related_id, api_response, status) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    record.user_transaction_hash,
                    record.chain,
                    type,
                    record.id,
                    JSON.stringify(verification),
                    verification.verified ? 'success' : 'failed'
                ]
            );

            if (verification.verified && verification.confirmations >= this.requiredConfirmations) {
                // Confirm the transaction
                await this.confirmTransaction(record.id, type, verification);
                
                console.log(`✅ Transaction ${record.user_transaction_hash} confirmed with ${verification.confirmations} confirmations`);
            } else if (verification.verified) {
                // Update confirmations count
                const table = type === 'payment' ? 'payment_transactions' : 'fee_payments';
                await pool.execute(
                    `UPDATE ${table} SET confirmations = ? WHERE id = ?`,
                    [verification.confirmations, record.id]
                );
                
                console.log(`⏳ Transaction ${record.user_transaction_hash} has ${verification.confirmations}/${this.requiredConfirmations} confirmations`);
            }

        } catch (error) {
            console.error(`Error verifying transaction ${record.user_transaction_hash}:`, error.message);
        }
    }

    // Confirm a transaction and update related records
    async confirmTransaction(recordId, type, verification) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            if (type === 'payment') {
                // Update payment transaction
                await connection.execute(
                    `UPDATE payment_transactions 
                     SET status = 'confirmed', 
                         confirmation_date = NOW(),
                         confirmations = ?,
                         from_address = ?,
                         to_address = ?,
                         blockchain_data = ?
                     WHERE id = ?`,
                    [
                        verification.confirmations,
                        verification.fromAddress,
                        verification.toAddress,
                        JSON.stringify(verification),
                        recordId
                    ]
                );

                // Get the payment record
                const [payment] = await connection.execute(
                    `SELECT * FROM payment_transactions WHERE id = ?`,
                    [recordId]
                );

                if (payment[0].investment_id) {
                    // Update payment schedule for investment
                    await connection.execute(
                        `UPDATE payment_schedule 
                         SET paid_amount = paid_amount + ?,
                             remaining_amount = remaining_amount - ?,
                             last_payment_date = NOW(),
                             status = CASE 
                                 WHEN (paid_amount + ?) >= total_required THEN 'completed'
                                 ELSE 'partial'
                             END
                         WHERE investment_id = ?`,
                        [
                            payment[0].amount,
                            payment[0].amount,
                            payment[0].amount,
                            payment[0].investment_id
                        ]
                    );

                    // Check if investment is fully paid
                    const [schedule] = await connection.execute(
                        `SELECT * FROM payment_schedule 
                         WHERE investment_id = ?`,
                        [payment[0].investment_id]
                    );

                    if (schedule[0].status === 'completed') {
                        // Activate investment
                        await connection.execute(
                            `UPDATE user_investments 
                             SET status = 'active',
                                 yield_start_date = NOW(),
                                 maturity_date = DATE_ADD(NOW(), INTERVAL 30 DAY)
                             WHERE id = ?`,
                            [payment[0].investment_id]
                        );

                        // Send notification
                        await this.sendNotification(
                            payment[0].user_id,
                            'Investment Activated',
                            `Your investment of $${payment[0].amount} has been fully paid and is now active.`
                        );
                    }
                }

            } else if (type === 'fee') {
                // Update fee payment
                await connection.execute(
                    `UPDATE fee_payments 
                     SET status = 'confirmed', 
                         confirmation_date = NOW(),
                         confirmations = ?,
                         from_address = ?,
                         to_address = ?,
                         blockchain_data = ?
                     WHERE id = ?`,
                    [
                        verification.confirmations,
                        verification.fromAddress,
                        verification.toAddress,
                        JSON.stringify(verification),
                        recordId
                    ]
                );

                // Get fee payment record
                const [fee] = await connection.execute(
                    `SELECT * FROM fee_payments WHERE id = ?`,
                    [recordId]
                );

                // Update investment fee_paid status
                await connection.execute(
                    `UPDATE user_investments 
                     SET fee_paid = TRUE 
                     WHERE id = ?`,
                    [fee[0].investment_id]
                );

                // Send notification
                await this.sendNotification(
                    fee[0].user_id,
                    'Withdrawal Fee Confirmed',
                    'Your $500 withdrawal fee has been confirmed. You can now proceed with withdrawal request.'
                );
            }

            await connection.commit();
            
        } catch (error) {
            await connection.rollback();
            console.error('Error confirming transaction:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Send notification (placeholder - implement with your notification service)
    async sendNotification(userId, title, message) {
        // This will be implemented with your notification service
        console.log(`📧 Notification for user ${userId}: ${title} - ${message}`);
    }

    // Generate payment QR code data
    generatePaymentQR(amount, chain, transactionId) {
        const walletAddress = chain === 'TRC20' ? this.trc20Address : this.bep20Address;
        const contractAddress = chain === 'TRC20' ? this.trc20UsdtContract : this.bep20UsdtContract;
        
        // EIP-681 format for BEP20, custom format for TRC20
        if (chain === 'BEP20') {
            return `ethereum:${contractAddress}/transfer?address=${walletAddress}&uint256=${amount * 1e18}`;
        } else {
            // TRC20 QR format
            return `tron:${walletAddress}?contract=${contractAddress}&amount=${amount}&decimal=6`;
        }
    }

    // Validate transaction hash format
    validateTransactionHash(hash, chain) {
        if (chain === 'TRC20') {
            // TRC20 transaction hashes start with 0x or just hex
            return /^(0x)?[a-fA-F0-9]{64}$/.test(hash);
        } else {
            // BEP20 transaction hashes start with 0x followed by 64 hex chars
            return /^0x[a-fA-F0-9]{64}$/.test(hash);
        }
    }

    // Get transaction status
    async getTransactionStatus(transactionHash, chain) {
        try {
            if (chain === 'TRC20') {
                const verification = await this.verifyTRC20Transaction(transactionHash);
                return {
                    status: verification.verified ? 'confirmed' : 'pending',
                    confirmations: verification.confirmations || 0,
                    requiredConfirmations: this.requiredConfirmations,
                    details: verification
                };
            } else {
                const verification = await this.verifyBEP20Transaction(transactionHash);
                return {
                    status: verification.verified ? 'confirmed' : 'pending',
                    confirmations: verification.confirmations || 0,
                    requiredConfirmations: this.requiredConfirmations,
                    details: verification
                };
            }
        } catch (error) {
            console.error('Error getting transaction status:', error.message);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
}

module.exports = BlockchainVerificationService;
