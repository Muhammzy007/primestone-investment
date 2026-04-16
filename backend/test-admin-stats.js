const axios = require('axios');
const { pool } = require('./config/database');

const testAdminStats = async () => {
    try {
        console.log('🔍 Testing Admin Stats Directly from Database:');
        console.log('==============================================');
        
        // Query directly from database
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
        
        console.log('\n✅ Database Stats:');
        console.log('------------------');
        console.log('Total Users:', stats[0].total_users);
        console.log('New Users (7d):', stats[0].new_users_7d);
        console.log('Total Investments:', stats[0].total_investments);
        console.log('Active Investments:', stats[0].active_investments);
        console.log('Pending Withdrawals:', stats[0].pending_withdrawals);
        console.log('Total Received: $', stats[0].total_received);
        console.log('Total Paid Out: $', stats[0].total_paid_out);
        
    } catch (error) {
        console.error('Error:', error);
    }
};

testAdminStats();
