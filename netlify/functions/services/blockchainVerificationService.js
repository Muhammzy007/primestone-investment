const axios = require('axios');
const { pool } = require('../config/database');

class BlockchainVerificationService {
    constructor() {
        this.tronGridApiKey = process.env.TRON_GRID_API_KEY;
        this.bscscanApiKey = process.env.BSCSCAN_API_KEY;
        this.tronGridUrl = process.env.TRON_GRID_URL || 'https://api.trongrid.io';
        this.bscscanUrl = process.env.BSCSCAN_URL || 'https://api.bscscan.com/api';
        this.requiredConfirmations = process.env.REQUIRED_CONFIRMATIONS || 12;
        this.trc20UsdtContract = process.env.USDT_TRC20_CONTRACT;
        this.bep20UsdtContract = process.env.USDT_BEP20_CONTRACT;
        this.trc20Address = process.env.TRC20_ADDRESS;
        this.bep20Address = process.env.BEP20_ADDRESS;
    }

    // Validate transaction hash format
    validateTransactionHash(hash, chain) {
        if (!hash || typeof hash !== 'string') return false;
        
        // FIXED: Added check for wallet addresses (Tron addresses start with T and are 34 chars)
        if (chain === 'TRC20') {
            // Check if it's a wallet address (Tron addresses start with T, length 34)
            if (hash.startsWith('T') && hash.length === 34) {
                console.log(`⚠️ This appears to be a TRC20 wallet address, not a transaction hash: ${hash}`);
                return false;
            }
            // TRC20 transaction hashes are 64 characters hex (with or without 0x)
            const isValid = /^(0x)?[a-fA-F0-9]{64}$/.test(hash);
            if (!isValid) {
                console.log(`❌ Invalid TRC20 hash format. Expected: 64 hex chars (with or without 0x), Got: ${hash}`);
            }
            return isValid;
        } else {
            // Check if it's a wallet address (BSC addresses start with 0x and are 42 chars)
            if (hash.startsWith('0x') && hash.length === 42) {
                console.log(`⚠️ This appears to be a BEP20 wallet address, not a transaction hash: ${hash}`);
                return false;
            }
            // BEP20 transaction hashes start with 0x followed by 64 hex chars
            const isValid = /^0x[a-fA-F0-9]{64}$/.test(hash);
            if (!isValid) {
                console.log(`❌ Invalid BEP20 hash format. Expected: 0x + 64 hex chars, Got: ${hash}`);
            }
            return isValid;
        }
    }

    // Verify TRC20 USDT transaction
    async verifyTRC20Transaction(transactionHash) {
        try {
            console.log(`🔍 Verifying TRC20 transaction: ${transactionHash}`);

            // Validate hash format first
            if (!this.validateTransactionHash(transactionHash, 'TRC20')) {
                return {
                    verified: false,
                    error: 'Invalid transaction hash format. Transaction hash should be 64 hexadecimal characters (with or without 0x prefix)',
                    code: 'INVALID_FORMAT',
                    expected: '64 hex chars (e.g., 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8)',
                    received: transactionHash
                };
            }

            // Get transaction info from TronGrid
            const response = await axios.get(
                `${this.tronGridUrl}/v1/transactions/${transactionHash}`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': this.tronGridApiKey
                    },
                    timeout: 10000
                }
            ).catch(error => {
                console.error('TronGrid API error:', error.message);
                return { data: { data: [] } };
            });

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                return {
                    verified: false,
                    error: 'Transaction not found on blockchain. Please check the transaction hash and try again.',
                    code: 'NOT_FOUND',
                    received: transactionHash
                };
            }

            const tx = response.data.data[0];

            // Check if it's a USDT transfer
            const contractData = tx.raw_data.contract[0].parameter.value;
            const isUsdtTransfer = contractData.contract_address === this.trc20UsdtContract;

            if (!isUsdtTransfer) {
                return {
                    verified: false,
                    error: 'Not a USDT transaction. Please ensure you are sending USDT tokens.',
                    code: 'WRONG_TOKEN'
                };
            }

            // Parse the amount from the transfer data
            const amount = this.parseTRC20Amount(contractData.data);
            const toAddress = contractData.to_address;
            const fromAddress = contractData.owner_address;

            // FIXED: Verify it's sent to our company wallet at that specific time
            if (toAddress !== this.trc20Address) {
                return {
                    verified: false,
                    error: 'Recipient address does not match company wallet',
                    code: 'WRONG_ADDRESS',
                    expectedAddress: this.trc20Address,
                    receivedAddress: toAddress
                };
            }

            // Get transaction info for confirmations
            const txInfoResponse = await axios.get(
                `${this.tronGridUrl}/v1/transactions/${transactionHash}/info`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': this.tronGridApiKey
                    },
                    timeout: 10000
                }
            ).catch(error => {
                console.error('Error getting tx info:', error.message);
                return { data: { data: [{ blockNumber: 0 }] } };
            });

            const blockNumber = txInfoResponse.data.data[0]?.blockNumber || 0;

            // Get current block number for confirmations
            const currentBlockResponse = await axios.get(
                `${this.tronGridUrl}/v1/blocks/latest`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': this.tronGridApiKey
                    },
                    timeout: 10000
                }
            ).catch(error => {
                console.error('Error getting current block:', error.message);
                return { data: { block_header: { raw_data: { number: 0 } } } };
            });

            const currentBlock = currentBlockResponse.data.block_header?.raw_data?.number || 0;
            const confirmations = blockNumber ? currentBlock - blockNumber : 0;

            // FIXED: Return the timestamp to verify it was sent at that specific time
            return {
                verified: true,
                transactionHash: transactionHash,
                fromAddress: fromAddress,
                toAddress: toAddress,
                amount: amount,
                confirmations: confirmations,
                blockNumber: blockNumber,
                timestamp: tx.block_timestamp, // This is the exact time the transaction occurred
                date: new Date(tx.block_timestamp).toISOString(),
                chain: 'TRC20',
                requiredConfirmations: this.requiredConfirmations,
                isConfirmed: confirmations >= this.requiredConfirmations
            };

        } catch (error) {
            console.error('TRC20 verification error:', error.message);
            return {
                verified: false,
                error: 'Blockchain verification error: ' + error.message,
                code: 'VERIFICATION_ERROR'
            };
        }
    }

    // Verify BEP20 USDT transaction
    async verifyBEP20Transaction(transactionHash) {
        try {
            console.log(`🔍 Verifying BEP20 transaction: ${transactionHash}`);

            // Validate hash format first
            if (!this.validateTransactionHash(transactionHash, 'BEP20')) {
                return {
                    verified: false,
                    error: 'Invalid BEP20 transaction hash format. Expected: 0x followed by 64 hexadecimal characters',
                    code: 'INVALID_FORMAT',
                    expected: '0x + 64 hex chars',
                    received: transactionHash
                };
            }

            // Get transaction receipt from BSCScan
            const response = await axios.get(
                `${this.bscscanUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${transactionHash}&apikey=${this.bscscanApiKey}`,
                { timeout: 10000 }
            ).catch(error => {
                console.error('BSCScan API error:', error.message);
                return { data: { result: null } };
            });

            if (!response.data || !response.data.result) {
                return {
                    verified: false,
                    error: 'Transaction not found on blockchain. Please check the transaction hash and try again.',
                    code: 'NOT_FOUND',
                    received: transactionHash
                };
            }

            const receipt = response.data.result;

            // Get transaction details
            const txResponse = await axios.get(
                `${this.bscscanUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${transactionHash}&apikey=${this.bscscanApiKey}`,
                { timeout: 10000 }
            ).catch(error => {
                console.error('Error getting transaction:', error.message);
                return { data: { result: null } };
            });

            if (!txResponse.data || !txResponse.data.result) {
                return {
                    verified: false,
                    error: 'Could not fetch transaction details',
                    code: 'NO_DETAILS'
                };
            }

            const tx = txResponse.data.result;

            // Check if it's a USDT transfer (to the USDT contract)
            if (tx.to.toLowerCase() !== this.bep20UsdtContract.toLowerCase()) {
                return {
                    verified: false,
                    error: 'Not a USDT transaction. Please ensure you are sending USDT tokens.',
                    code: 'WRONG_TOKEN'
                };
            }

            // Parse the transfer data
            const { toAddress, amount } = this.parseBEP20Transfer(tx.input, tx.from);

            // FIXED: Verify it's sent to our company wallet at that specific time
            if (toAddress.toLowerCase() !== this.bep20Address.toLowerCase()) {
                return {
                    verified: false,
                    error: 'Recipient address does not match company wallet',
                    code: 'WRONG_ADDRESS',
                    expectedAddress: this.bep20Address,
                    receivedAddress: toAddress
                };
            }

            // Get block number for confirmations
            const blockNumber = parseInt(receipt.blockNumber, 16);

            // Get current block number
            const blockResponse = await axios.get(
                `${this.bscscanUrl}?module=proxy&action=eth_blockNumber&apikey=${this.bscscanApiKey}`,
                { timeout: 10000 }
            ).catch(error => {
                console.error('Error getting current block:', error.message);
                return { data: { result: '0x0' } };
            });

            const currentBlock = parseInt(blockResponse.data.result, 16);
            const confirmations = currentBlock - blockNumber;

            // Get block timestamp
            const timestampResponse = await axios.get(
                `${this.bscscanUrl}?module=block&action=getblockreward&blockno=${blockNumber}&apikey=${this.bscscanApiKey}`,
                { timeout: 10000 }
            ).catch(error => {
                console.error('Error getting block timestamp:', error.message);
                return { data: { result: { timeStamp: Date.now() / 1000 } } };
            });

            const timestamp = timestampResponse.data.result?.timeStamp * 1000 || Date.now();

            return {
                verified: true,
                transactionHash: transactionHash,
                fromAddress: tx.from,
                toAddress: toAddress,
                amount: amount,
                confirmations: confirmations,
                blockNumber: blockNumber,
                timestamp: timestamp,
                date: new Date(timestamp).toISOString(),
                chain: 'BEP20',
                requiredConfirmations: this.requiredConfirmations,
                isConfirmed: confirmations >= this.requiredConfirmations
            };

        } catch (error) {
            console.error('BEP20 verification error:', error.message);
            return {
                verified: false,
                error: 'Blockchain verification error: ' + error.message,
                code: 'VERIFICATION_ERROR'
            };
        }
    }

    async verifyAllPendingTransactions() {
        try {
            console.log('🔍 Checking for pending transactions to verify...');

            // FIXED: Added check to ensure we're only getting records with valid transaction hashes
            const [pendingPayments] = await pool.execute(
                `SELECT pt.*, cw.chain
                 FROM payment_transactions pt
                 JOIN company_wallets cw ON pt.company_wallet_id = cw.id
                 WHERE pt.status = 'pending'
                 AND pt.user_transaction_hash IS NOT NULL
                 AND pt.user_transaction_hash != ''
                 AND LENGTH(pt.user_transaction_hash) > 40` // FIXED: Filter out wallet addresses (wallet addresses are shorter)
            );
            console.log(`Found ${pendingPayments.length} pending payments with valid transaction hashes`);

            let verifiedCount = 0;
            for (const payment of pendingPayments) {
                // FIXED: Skip obvious wallet addresses
                if ((payment.chain === 'TRC20' && payment.user_transaction_hash.startsWith('T') && payment.user_transaction_hash.length === 34) ||
                    (payment.chain === 'BEP20' && payment.user_transaction_hash.startsWith('0x') && payment.user_transaction_hash.length === 42)) {
                    console.log(`⚠️ Skipping - this appears to be a wallet address, not a transaction hash: ${payment.user_transaction_hash}`);
                    
                    // Optionally update the record to mark it as invalid
                    await pool.execute(
                        `UPDATE payment_transactions 
                         SET status = 'failed',
                             admin_notes = 'Invalid: This appears to be a wallet address, not a transaction hash'
                         WHERE id = ?`,
                        [payment.id]
                    );
                    continue;
                }

                const result = await this.verifyTransaction(payment, 'payment');
                if (result.verified) verifiedCount++;
            }

            console.log(`✅ Verified ${verifiedCount} transactions`);
            return verifiedCount;

        } catch (error) {
            console.error('Error verifying pending transactions:', error.message);
            return 0;
        }
    }

    async verifyTransaction(record, type) {
        try {
            let verification;

            if (record.chain === 'TRC20') {
                verification = await this.verifyTRC20Transaction(record.user_transaction_hash);
            } else {
                verification = await this.verifyBEP20Transaction(record.user_transaction_hash);
            }

            console.log(`Verification result for ${record.user_transaction_hash}:`, verification);

            if (verification.verified) {
                // FIXED: Check amount matches (within small margin for decimal differences)
                if (Math.abs(verification.amount - record.amount) > 0.01) {
                    console.log(`❌ Amount mismatch: expected ${record.amount}, got ${verification.amount}`);
                    
                    // Mark as failed due to amount mismatch
                    const table = type === 'payment' ? 'payment_transactions' : 'fee_payments';
                    await pool.execute(
                        `UPDATE ${table}
                         SET status = 'failed',
                             admin_notes = ?,
                             blockchain_data = ?
                         WHERE id = ?`,
                        [`Amount mismatch: expected ${record.amount}, got ${verification.amount}`,
                         JSON.stringify(verification),
                         record.id]
                    );
                    
                    return { verified: false, error: 'Amount mismatch' };
                }

                // Check confirmations
                if (verification.confirmations >= this.requiredConfirmations) {
                    const table = type === 'payment' ? 'payment_transactions' : 'fee_payments';
                    
                    // FIXED: Store the full blockchain verification data including timestamp
                    await pool.execute(
                        `UPDATE ${table}
                         SET status = 'confirmed',
                             confirmation_date = NOW(),
                             confirmations = ?,
                             from_address = ?,
                             to_address = ?,
                             blockchain_data = ?
                         WHERE id = ?`,
                        [verification.confirmations, 
                         verification.fromAddress, 
                         verification.toAddress,
                         JSON.stringify({
                             ...verification,
                             verifiedAt: new Date().toISOString()
                         }),
                         record.id]
                    );

                    console.log(`✅ Transaction ${record.user_transaction_hash} confirmed with ${verification.confirmations} confirmations at ${verification.date}`);

                    // If it's a payment transaction, update investment status
                    if (type === 'payment') {
                        await this.updateInvestmentAfterPayment(record);
                    }

                    return { verified: true, confirmed: true };
                } else {
                    const table = type === 'payment' ? 'payment_transactions' : 'fee_payments';
                    
                    // Update confirmations count
                    await pool.execute(
                        `UPDATE ${table} 
                         SET confirmations = ?, 
                             from_address = ?, 
                             to_address = ?,
                             blockchain_data = ?
                         WHERE id = ?`,
                        [verification.confirmations, 
                         verification.fromAddress, 
                         verification.toAddress,
                         JSON.stringify(verification),
                         record.id]
                    );

                    console.log(`⏳ Transaction ${record.user_transaction_hash} has ${verification.confirmations}/${this.requiredConfirmations} confirmations`);
                    return { verified: true, confirmed: false, confirmations: verification.confirmations };
                }
            } else {
                console.log(`❌ Transaction ${record.user_transaction_hash} verification failed: ${verification.error}`);
                
                // FIXED: Mark as failed if verification fails
                if (verification.code === 'INVALID_FORMAT' || verification.code === 'NOT_FOUND') {
                    const table = type === 'payment' ? 'payment_transactions' : 'fee_payments';
                    await pool.execute(
                        `UPDATE ${table}
                         SET status = 'failed',
                             admin_notes = ?,
                             blockchain_data = ?
                         WHERE id = ?`,
                        [verification.error,
                         JSON.stringify(verification),
                         record.id]
                    );
                }
                
                return { verified: false, error: verification.error, code: verification.code };
            }

        } catch (error) {
            console.error(`Error verifying transaction ${record.user_transaction_hash}:`, error.message);
            return { verified: false, error: error.message };
        }
    }

    async updateInvestmentAfterPayment(payment) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Update payment schedule
            await connection.execute(
                `UPDATE payment_schedule
                 SET paid_amount = paid_amount + ?,
                     remaining_amount = remaining_amount - ?,
                     last_payment_date = NOW()
                 WHERE investment_id = ?`,
                [payment.amount, payment.amount, payment.investment_id]
            );

            // Get updated schedule with package info
            const [schedule] = await connection.execute(
                `SELECT ps.*, ui.package_id, ui.investment_amount, ip.min_investment, ip.yield_rate
                 FROM payment_schedule ps
                 JOIN user_investments ui ON ps.investment_id = ui.id
                 JOIN investment_packages ip ON ui.package_id = ip.id
                 WHERE ps.investment_id = ?`,
                [payment.investment_id]
            );

            if (schedule.length > 0) {
                const paidAmount = schedule[0].paid_amount;
                const minInvestment = schedule[0].min_investment;
                const totalRequired = schedule[0].total_required;

                // Check if minimum investment is reached
                if (paidAmount >= minInvestment && schedule[0].status !== 'active') {
                    // Calculate current value based on paid amount
                    const currentValue = paidAmount;

                    await connection.execute(
                        `UPDATE user_investments
                         SET status = 'active',
                             current_value = ?,
                             yield_start_date = NOW(),
                             maturity_date = DATE_ADD(NOW(), INTERVAL 180 DAY)
                         WHERE id = ?`,
                        [currentValue, payment.investment_id]
                    );

                    console.log(`💰 Investment ${payment.investment_id} ACTIVATED! Minimum investment reached ($${paidAmount} >= $${minInvestment})`);
                }

                // Check if fully paid
                if (paidAmount >= totalRequired) {
                    await connection.execute(
                        `UPDATE user_investments
                         SET paid_in_full = TRUE
                         WHERE id = ?`,
                        [payment.investment_id]
                    );

                    console.log(`✅ Investment ${payment.investment_id} fully paid!`);
                }
            }

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            console.error('Error updating investment after payment:', error);
        } finally {
            connection.release();
        }
    }

    parseTRC20Amount(hexData) {
        try {
            const amountHex = hexData.substring(hexData.length - 64);
            const amountWei = BigInt('0x' + amountHex);
            return Number(amountWei) / 1_000_000;
        } catch (error) {
            console.error('Error parsing TRC20 amount:', error);
            return 0;
        }
    }

    parseBEP20Transfer(input, fromAddress) {
        try {
            // Method ID for transfer (0xa9059cbb)
            // Data format: 0xa9059cbb + 32 bytes address + 32 bytes amount
            if (input.startsWith('0xa9059cbb') && input.length >= 138) {
                const toAddress = '0x' + input.slice(34, 74); // Extract address (last 40 chars of first 32 bytes)
                const amountHex = input.slice(74, 138); // Next 32 bytes for amount
                const amountWei = BigInt('0x' + amountHex);
                const amount = Number(amountWei) / 1_000_000_000_000_000_000; // Convert from wei to USDT (1e18)
                
                return { toAddress, amount };
            }
            return { toAddress: null, amount: 0 };
        } catch (error) {
            console.error('Error parsing BEP20 transfer:', error);
            return { toAddress: null, amount: 0 };
        }
    }

    generatePaymentReference(userId, investmentId) {
        return `PS-${userId}-${investmentId}-${Date.now()}`;
    }
}

module.exports = BlockchainVerificationService;
