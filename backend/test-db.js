const { testConnection } = require('./config/database');

async function runTest() {
    console.log('Testing database connection...');
    const connected = await testConnection();
    if (connected) {
        console.log('✅ Database connection successful');
    } else {
        console.log('❌ Database connection failed');
    }
    process.exit(0);
}

runTest();
