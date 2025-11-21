// create-admin.js
// Creates the default admin user in MySQL

require('dotenv').config();
const { sequelize, Admin } = require('./models-sequelize');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to MySQL\n');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('You can update the password if needed.\n');
      await sequelize.close();
      return;
    }

    // Create new admin user
    const admin = await Admin.create({
      username: 'admin',
      password: 'admin123', // This will be hashed automatically by the model
      email: 'admin@catholicmarket.com',
      role: 'superadmin',
      active: true
    });

    console.log('✓ Admin user created successfully!\n');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nYou can now log in to the admin dashboard.\n');

    await sequelize.close();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
