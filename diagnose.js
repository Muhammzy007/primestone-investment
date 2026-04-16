const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const axios = require('axios');

async function diagnose() {
  console.log('🔍 DIAGNOSIS START\n');
  
  // Test 1: Database connection
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'u0_a320',
      password: '129486',
      database: 'primestone_db'
    });
    console.log('✅ Database connected');
    
    // Check users
    const [users] = await connection.execute('SELECT id, username, email, role FROM users');
    console.log('\n📊 Users in database:');
    users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    
    // Check admin specifically
    const [admin] = await connection.execute('SELECT * FROM users WHERE email = ?', ['techmagnet.pro@gmail.com']);
    if (admin.length > 0) {
      console.log('\n✅ Admin user found:');
      console.log(`   ID: ${admin[0].id}`);
      console.log(`   Username: ${admin[0].username}`);
      console.log(`   Email: ${admin[0].email}`);
      console.log(`   Role: ${admin[0].role}`);
      console.log(`   Active: ${admin[0].is_active}`);
      
      // Test password hash
      const testPassword = '@UniqueP01';
      const isValid = bcrypt.compareSync(testPassword, admin[0].password_hash);
      console.log(`\n🔐 Password test: ${isValid ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (!isValid) {
        // Create new correct hash
        const newHash = bcrypt.hashSync(testPassword, 10);
        console.log(`\n📝 New hash generated: ${newHash}`);
        
        // Update the database
        await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, admin[0].id]);
        console.log('✅ Password updated in database');
      }
    } else {
      console.log('\n❌ Admin user not found! Creating now...');
      
      const newHash = bcrypt.hashSync('@UniqueP01', 10);
      await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, email_verified, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', 'techmagnet.pro@gmail.com', newHash, 'admin', true, true]
      );
      console.log('✅ Admin user created');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
  
  // Test 2: API connection
  console.log('\n🌐 Testing API...');
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'techmagnet.pro@gmail.com',
      password: '@UniqueP01'
    });
    console.log('✅ API login successful!');
    console.log('   User:', response.data.data.user);
  } catch (error) {
    console.error('❌ API login failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Backend not running on port 3000');
    } else {
      console.error('   ', error.message);
    }
  }
  
  console.log('\n🔍 DIAGNOSIS COMPLETE');
}

diagnose();
