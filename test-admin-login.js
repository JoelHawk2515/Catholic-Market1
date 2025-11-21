// test-admin-login.js
// Test admin login credentials

require('dotenv').config();
const { sequelize, Admin } = require('./models-sequelize');

async function testLogin() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to MySQL\n');

    // Find admin user
    const admin = await Admin.findOne({ where: { username: 'admin', active: true } });
    
    if (!admin) {
      console.log('✗ No admin user found!');
      console.log('Run: node create-admin.js\n');
      await sequelize.close();
      return;
    }

    console.log('Admin user found:');
    console.log('  ID:', admin.id);
    console.log('  Username:', admin.username);
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Active:', admin.active);
    console.log('  Password hash:', admin.password.substring(0, 20) + '...');
    console.log();

    // Test password
    const testPassword = 'admin123';
    console.log(`Testing password: "${testPassword}"`);
    
    const isMatch = await admin.comparePassword(testPassword);
    
    if (isMatch) {
      console.log('✓ Password matches! Login should work.\n');
    } else {
      console.log('✗ Password does NOT match!\n');
      console.log('Recreating admin with correct password...');
      
      admin.password = testPassword;
      await admin.save();
      
      console.log('✓ Admin password updated. Try logging in again.\n');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();
