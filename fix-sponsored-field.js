// fix-sponsored-field.js
// This script adds the 'sponsored' field to all businesses that don't have it

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Business = require('./models/Business');

async function fixSponsoredField() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Find all businesses without a sponsored field or where it's undefined
    const result = await Business.updateMany(
      { $or: [{ sponsored: { $exists: false } }, { sponsored: null }] },
      { $set: { sponsored: false } }
    );

    console.log(`Updated ${result.modifiedCount} businesses with sponsored: false`);

    // Show current sponsored count
    const sponsoredCount = await Business.countDocuments({ sponsored: true });
    const totalCount = await Business.countDocuments({});
    
    console.log(`\nCurrent status:`);
    console.log(`  Total businesses: ${totalCount}`);
    console.log(`  Sponsored businesses: ${sponsoredCount}`);
    console.log(`  Non-sponsored businesses: ${totalCount - sponsoredCount}`);

    await mongoose.connection.close();
    console.log('\nDone! Database connection closed.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixSponsoredField();
