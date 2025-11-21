// update-all-businesses.js
// This script ensures all businesses have all the latest fields with proper defaults

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Business = require('./models/Business');

async function updateAllBusinesses() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    // Get all businesses
    const allBusinesses = await Business.find({});
    console.log(`Found ${allBusinesses.length} total businesses\n`);

    let updatedCount = 0;
    let errors = 0;

    for (const business of allBusinesses) {
      try {
        let needsUpdate = false;
        const updates = {};

        // Check and set sponsored field (default: false)
        if (business.sponsored === undefined || business.sponsored === null) {
          updates.sponsored = false;
          needsUpdate = true;
        }

        // Check and set verified field (default: false for safety)
        if (business.verified === undefined || business.verified === null) {
          updates.verified = false;
          needsUpdate = true;
        }

        // Check and set imageUrl (default: null)
        if (business.imageUrl === undefined) {
          updates.imageUrl = null;
          needsUpdate = true;
        }

        // Check and set amenities (default: false)
        if (business.hasWifi === undefined || business.hasWifi === null) {
          updates.hasWifi = false;
          needsUpdate = true;
        }

        if (business.familyFriendly === undefined || business.familyFriendly === null) {
          updates.familyFriendly = false;
          needsUpdate = true;
        }

        if (business.hasParking === undefined || business.hasParking === null) {
          updates.hasParking = false;
          needsUpdate = true;
        }

        // Check and set address fields
        if (business.street === undefined) {
          updates.street = null;
          needsUpdate = true;
        }

        if (business.city === undefined) {
          updates.city = null;
          needsUpdate = true;
        }

        if (business.state === undefined) {
          updates.state = null;
          needsUpdate = true;
        }

        if (business.zip === undefined) {
          updates.zip = null;
          needsUpdate = true;
        }

        // Check lat/lng (should allow null for businesses without coordinates)
        if (business.lat === undefined) {
          updates.lat = null;
          needsUpdate = true;
        }

        if (business.lng === undefined) {
          updates.lng = null;
          needsUpdate = true;
        }

        // Ensure tags is an array
        if (!Array.isArray(business.tags)) {
          if (business.tags) {
            updates.tags = [business.tags];
          } else {
            updates.tags = [];
          }
          needsUpdate = true;
        }

        if (needsUpdate) {
          await Business.updateOne({ _id: business._id }, { $set: updates });
          updatedCount++;
          console.log(`✓ Updated: ${business.name}`);
          
          // Show what was updated
          const updateKeys = Object.keys(updates);
          if (updateKeys.length > 0) {
            console.log(`  Fields updated: ${updateKeys.join(', ')}`);
          }
        }
      } catch (err) {
        console.error(`✗ Error updating ${business.name}:`, err.message);
        errors++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total businesses: ${allBusinesses.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors: ${errors}`);
    console.log(`Already up to date: ${allBusinesses.length - updatedCount - errors}`);

    // Show current field statistics
    console.log('\n=== Current Field Statistics ===');
    
    const verifiedCount = await Business.countDocuments({ verified: true });
    const sponsoredCount = await Business.countDocuments({ sponsored: true });
    const withImagesCount = await Business.countDocuments({ imageUrl: { $ne: null } });
    const hasWifiCount = await Business.countDocuments({ hasWifi: true });
    const familyFriendlyCount = await Business.countDocuments({ familyFriendly: true });
    const hasParkingCount = await Business.countDocuments({ hasParking: true });
    const withCoordsCount = await Business.countDocuments({ 
      lat: { $ne: null }, 
      lng: { $ne: null } 
    });

    console.log(`Verified businesses: ${verifiedCount}`);
    console.log(`Sponsored businesses: ${sponsoredCount}`);
    console.log(`Businesses with images: ${withImagesCount}`);
    console.log(`Businesses with WiFi: ${hasWifiCount}`);
    console.log(`Family-friendly businesses: ${familyFriendlyCount}`);
    console.log(`Businesses with parking: ${hasParkingCount}`);
    console.log(`Businesses with coordinates: ${withCoordsCount}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    console.log('Update complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateAllBusinesses();
