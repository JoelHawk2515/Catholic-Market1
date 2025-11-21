// update-all-submissions.js
// This script ensures all submissions have all the latest fields with proper defaults

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Submission = require('./models/Submission');

async function updateAllSubmissions() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    // Get all submissions
    const allSubmissions = await Submission.find({});
    console.log(`Found ${allSubmissions.length} total submissions\n`);

    let updatedCount = 0;
    let errors = 0;

    for (const submission of allSubmissions) {
      try {
        let needsUpdate = false;
        const updates = {};

        // Check and set imageUrl (default: null)
        if (submission.imageUrl === undefined) {
          updates.imageUrl = null;
          needsUpdate = true;
        }

        // Check and set amenities (default: false)
        if (submission.hasWifi === undefined || submission.hasWifi === null) {
          updates.hasWifi = false;
          needsUpdate = true;
        }

        if (submission.familyFriendly === undefined || submission.familyFriendly === null) {
          updates.familyFriendly = false;
          needsUpdate = true;
        }

        if (submission.hasParking === undefined || submission.hasParking === null) {
          updates.hasParking = false;
          needsUpdate = true;
        }

        // Check and set address fields
        if (submission.street === undefined) {
          updates.street = null;
          needsUpdate = true;
        }

        if (submission.city === undefined) {
          updates.city = null;
          needsUpdate = true;
        }

        if (submission.state === undefined) {
          updates.state = null;
          needsUpdate = true;
        }

        if (submission.zip === undefined) {
          updates.zip = null;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await Submission.updateOne({ _id: submission._id }, { $set: updates });
          updatedCount++;
          console.log(`✓ Updated: ${submission.name} (${submission.status})`);
          
          // Show what was updated
          const updateKeys = Object.keys(updates);
          if (updateKeys.length > 0) {
            console.log(`  Fields updated: ${updateKeys.join(', ')}`);
          }
        }
      } catch (err) {
        console.error(`✗ Error updating ${submission.name}:`, err.message);
        errors++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total submissions: ${allSubmissions.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors: ${errors}`);
    console.log(`Already up to date: ${allSubmissions.length - updatedCount - errors}`);

    // Show current submission statistics
    console.log('\n=== Current Submission Statistics ===');
    
    const pendingCount = await Submission.countDocuments({ status: 'pending' });
    const approvedCount = await Submission.countDocuments({ status: 'approved' });
    const rejectedCount = await Submission.countDocuments({ status: 'rejected' });

    console.log(`Pending: ${pendingCount}`);
    console.log(`Approved: ${approvedCount}`);
    console.log(`Rejected: ${rejectedCount}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    console.log('Update complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateAllSubmissions();
