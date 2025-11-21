// test-mysql-connection.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing MySQL connection...');
  console.log('Host:', process.env.MYSQL_HOST);
  console.log('Port:', process.env.MYSQL_PORT);
  console.log('User:', process.env.MYSQL_USER);
  console.log('Database:', process.env.MYSQL_DATABASE);
  console.log();

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectTimeout: 10000 // 10 seconds
    });

    console.log('✓ MySQL connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('✓ Query test successful:', rows[0]);
    
    await connection.end();
    console.log('✓ Connection closed');
  } catch (error) {
    console.error('✗ MySQL connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\nPossible issues:');
      console.log('1. MySQL server firewall is blocking external connections');
      console.log('2. MySQL server is not running');
      console.log('3. The host address is incorrect');
      console.log('4. MySQL is not configured to accept remote connections');
    }
  }
}

testConnection();
