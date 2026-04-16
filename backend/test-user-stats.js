const { pool } = require('./config/database');

const testUserStats = async (userId) => {
    try {
        console.log(`🔍 Testing User Stats for User ID: ${userId}`);
        console.log('==============================================');
        
        // Query user's investments
        const [investments] = await pool.execute(
            `SELECT ui.*, ip.package_name 
             FROM user_investments ui
             JOIN investment_packages ip ON ui.package_id = ip.id
             WHERE ui.user_id = ?`,
            [userId]
        );
        
        console.log(`\nUser has ${investments.length} investments:`);
        investments.forEach((inv, i) => {
            console.log(`\n${i+1}. ${inv.package_name}:`);
            console.log(`   - Amount: $${inv.investment_amount}`);
            console.log(`   - Status: ${inv.status}`);
            console.log(`   - Current Value: $${inv.current_value || 0}`);
            console.log(`   - Expected Return: $${inv.expected_return}`);
        });
        
        // Calculate stats
        const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.investment_amount), 0);
        const activeCount = investments.filter(inv => inv.status === 'active').length;
        const totalReturns = investments.reduce((sum, inv) => sum + Number(inv.expected_return), 0);
        const currentValue = investments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);
        
        console.log('\n✅ Calculated Stats:');
        console.log('-------------------');
        console.log('Total Invested: $', totalInvested);
        console.log('Active Investments:', activeCount);
        console.log('Expected Returns: $', totalReturns);
        console.log('Current Value: $', currentValue);
        
    } catch (error) {
        console.error('Error:', error);
    }
};

// Test for a specific user (use one of your user IDs from the database)
// First, let's get a list of users
const getUsers = async () => {
    const [users] = await pool.execute('SELECT id, username, email FROM users LIMIT 5');
    console.log('\nAvailable users:');
    users.forEach(u => console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`));
    return users;
};

getUsers().then(users => {
    if (users.length > 0) {
        testUserStats(users[0].id);
    }
});
