const axios = require('axios');
require('dotenv').config();

const testLogin = async () => {
    try {
        console.log('Testing login endpoint...');
        console.log('========================');
        
        const testUser = {
            email: 'admin@primestone.com',  // Use your actual test user
            password: 'Admin@123'            // Use actual password
        };

        console.log('Sending request to:', 'http://localhost:3000/api/auth/login');
        console.log('With credentials:', { email: testUser.email, password: '***' });

        const response = await axios.post('http://localhost:3000/api/auth/login', testUser, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('\n✅ Response received:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('\n❌ Error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else if (error.request) {
            console.log('No response received. Is the server running?');
        } else {
            console.log('Error:', error.message);
        }
    }
};

testLogin();
