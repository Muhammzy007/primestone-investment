const { pool } = require('../config/database');

class CleanupService {
    // Clean up pending transactions older than 24 hours
    async cleanupPendingTransactions() {
        const connection = await pool.getConnection();
        
        try {
            console.log('🧹 Running cleanup service - checking for expired pending transactions...');
            
            await connection.beginTransaction();
            
            // Find pending transactions older than 24 hours
            const [expiredPayments] = await connection.execute(`
                SELECT pt.*, ui.user_id, ui.id as investment_id
                FROM payment_transactions pt
                JOIN user_investments ui ON pt.investment_id = ui.id
                WHERE pt.status = 'pending' 
                AND pt.payment_date < DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);
            
            console.log(`Found ${expiredPayments.length} expired pending payments`);
            
            // Mark them as failed
            for (const payment of expiredPayments) {
                await connection.execute(
                    `UPDATE payment_transactions 
                     SET status = 'failed', 
                         admin_notes = 'Auto-failed after 24 hours pending'
                     WHERE id = ?`,
                    [payment.id]
                );
                
                console.log(`❌ Payment #${payment.id} auto-failed after 24 hours`);
            }
            
            // Also check for expired fee payments
            const [expiredFees] = await connection.execute(`
                SELECT * FROM fee_payments 
                WHERE status = 'pending' 
                AND payment_date < DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);
            
            console.log(`Found ${expiredFees.length} expired pending fees`);
            
            for (const fee of expiredFees) {
                await connection.execute(
                    `UPDATE fee_payments 
                     SET status = 'failed', 
                         admin_notes = 'Auto-failed after 24 hours pending'
                     WHERE id = ?`,
                    [fee.id]
                );
                
                console.log(`❌ Fee #${fee.id} auto-failed after 24 hours`);
            }
            
            await connection.commit();
            console.log('✅ Cleanup completed successfully');
            
            return {
                paymentsCleaned: expiredPayments.length,
                feesCleaned: expiredFees.length
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('❌ Cleanup error:', error);
            return { error: error.message };
        } finally {
            connection.release();
        }
    }
    
    // Update investment stats to only count confirmed/active
    async updateInvestmentStats() {
        try {
            console.log('📊 Updating investment stats - removing pending from calculations...');
            
            // Update user_investments current_value only for active ones
            await pool.execute(`
                UPDATE user_investments ui
                JOIN investment_packages ip ON ui.package_id = ip.id
                SET ui.current_value = ui.investment_amount * 
                    POWER(1 + (ip.daily_yield_rate/100), 
                    DATEDIFF(NOW(), ui.yield_start_date))
                WHERE ui.status = 'active' 
                AND ui.yield_start_date IS NOT NULL
            `);
            
            console.log('✅ Investment stats updated');
            
        } catch (error) {
            console.error('❌ Error updating investment stats:', error);
        }
    }
}

module.exports = CleanupService;
