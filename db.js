// db.js - MySQL connection module using Sequelize
const { sequelize } = require('./models-sequelize');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Attempting MySQL connection...');
    await sequelize.authenticate();
    console.log('✓ MySQL connected successfully');

    // Sync database (creates tables if they don't exist)
    console.log('Syncing database tables...');
    await sequelize.sync({ alter: true });
    console.log('✓ Database tables synced');
  } catch (error) {
    console.error('✗ MySQL connection error:', error.message);
    console.error('Full error:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check if MySQL is running on the VPS');
    console.log('2. Verify firewall allows port 3306');
    console.log('3. Confirm MySQL is configured for remote connections (bind-address = 0.0.0.0)');
    console.log('4. Test connection: node test-mysql-connection.js');
    process.exit(1);
  }
};

module.exports = connectDB;
