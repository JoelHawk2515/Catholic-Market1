// add-schedule-column.js
// Add schedule column to businesses and submissions tables

const mysql = require('mysql2/promise');
require('dotenv').config();

const defaultSchedule = JSON.stringify({
  sunday: { open: null, close: null },
  monday: { open: null, close: null },
  tuesday: { open: null, close: null },
  wednesday: { open: null, close: null },
  thursday: { open: null, close: null },
  friday: { open: null, close: null },
  saturday: { open: null, close: null }
});

async function addScheduleColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '104.129.131.25',
      user: process.env.MYSQL_USER || 'devuser',
      password: process.env.MYSQL_PASSWORD || 'SuperCathSet2515!',
      database: process.env.MYSQL_DATABASE || 'catholicMarket'
    });

    console.log('Connected to MySQL database');

    // Check if schedule column already exists in businesses
    const [businessCols] = await connection.query("SHOW COLUMNS FROM businesses LIKE 'schedule'");
    
    if (businessCols.length === 0) {
      console.log('Adding schedule column to businesses table...');
      await connection.query(`
        ALTER TABLE businesses 
        ADD COLUMN schedule JSON NULL
      `);
      console.log('✓ Added schedule column to businesses table');
    } else {
      console.log('✓ Schedule column already exists in businesses table');
    }

    // Check if schedule column already exists in submissions
    const [submissionCols] = await connection.query("SHOW COLUMNS FROM submissions LIKE 'schedule'");
    
    if (submissionCols.length === 0) {
      console.log('Adding schedule column to submissions table...');
      await connection.query(`
        ALTER TABLE submissions 
        ADD COLUMN schedule JSON NULL
      `);
      console.log('✓ Added schedule column to submissions table');
    } else {
      console.log('✓ Schedule column already exists in submissions table');
    }

    console.log('\n✓ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addScheduleColumn()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
  });
