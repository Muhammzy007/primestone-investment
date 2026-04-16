const mysql = require('mysql2');

console.log('🔍 Diagnosing database connection...\n');

// Try different connection methods
const methods = [
  {
    name: 'TCP via localhost',
    config: {
      host: 'localhost',
      user: 'u0_a320',
      password: '129486',
      database: 'primestone_db',
      port: 3306
    }
  },
  {
    name: 'TCP via 127.0.0.1',
    config: {
      host: '127.0.0.1',
      user: 'u0_a320',
      password: '129486',
      database: 'primestone_db',
      port: 3306
    }
  },
  {
    name: 'Unix Socket',
    config: {
      socketPath: '/data/data/com.termux/files/usr/var/run/mysqld.sock',
      user: 'u0_a320',
      password: '129486',
      database: 'primestone_db'
    }
  }
];

async function tryMethod(method) {
  return new Promise((resolve) => {
    console.log(`Testing: ${method.name}...`);
    const connection = mysql.createConnection(method.config);
    
    connection.connect((err) => {
      if (err) {
        console.log(`  ❌ Failed: ${err.message}`);
        resolve(false);
      } else {
        console.log(`  ✅ Success!`);
        connection.end();
        resolve(true);
      }
    });
  });
}

async function run() {
  for (const method of methods) {
    await tryMethod(method);
  }
  console.log('\n✅ Diagnosis complete');
}

run();
