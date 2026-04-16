const axios = require('axios');
const { pool } = require('./config/database');

// You'll need to get a valid admin token first
// For now, let's query the database directly to see what stats should be
const testAdminStats = async () => {
    try {
        console.log('🔍 Direct Database Query Results:');
        console.log('================================');
        
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
        console.log('total_users:', stats[0].total_users);
        console.log('new_users_7d:', stats[0].new_users_7d);
        console.log('total_investments:', stats[0].total_investments);
        console.log('active_investments:', stats[0].active_investments);
        console.log('pending_withdrawals:', stats[0].pending_withdrawals);
        console.log('total_received:', stats[0].total_received);
        console.log('total_paid_out:', stats[0].total_paid_out);
        
    } catch (error) {
        console.error('Error:', error);
    }
};

testAdminStats();
