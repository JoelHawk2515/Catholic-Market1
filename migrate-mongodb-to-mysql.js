// migrate-mongodb-to-mysql.js
// This script migrates all data from MongoDB to MySQL

require('dotenv').config();
const mongoose = require('mongoose');
const { sequelize, Admin, Parish, Business, Submission, Analytics } = require('./models-sequelize');

// Import MongoDB models
const MongoAdmin = require('./models/Admin');
const MongoParish = require('./models/Parish');
const MongoBusiness = require('./models/Business');
const MongoSubmission = require('./models/Submission');
const MongoAnalytics = require('./models/Analytics');

async function migrateData() {
  try {
    console.log('=== Starting MongoDB to MySQL Migration ===\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected\n');

    // Connect to MySQL and create tables
    console.log('Connecting to MySQL...');
    await sequelize.authenticate();
    console.log('✓ MySQL connected');
    
    // Force sync to create fresh tables
    await sequelize.sync({ force: true });
    console.log('✓ MySQL tables created\n');

    // Migrate Admins
    console.log('Migrating Admins...');
    const mongoAdmins = await MongoAdmin.find({}).lean();
    for (const admin of mongoAdmins) {
      await Admin.create({
        username: admin.username,
        password: admin.password, // Already hashed in MongoDB
        email: admin.email,
        role: admin.role,
        active: admin.active,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      });
    }
    console.log(`✓ Migrated ${mongoAdmins.length} admins\n`);

    // Migrate Parishes with ID mapping
    console.log('Migrating Parishes...');
    const mongoParishes = await MongoParish.find({}).lean();
    const parishIdMap = {}; // Map MongoDB _id to MySQL id
    
    for (const parish of mongoParishes) {
      const newParish = await Parish.create({
        name: parish.name,
        address: parish.address,
        street: parish.street,
        city: parish.city,
        state: parish.state,
        zip: parish.zip,
        lat: parish.lat,
        lng: parish.lng,
        phone: parish.phone,
        website: parish.website,
        createdAt: parish.createdAt,
        updatedAt: parish.updatedAt
      });
      parishIdMap[parish._id.toString()] = newParish.id;
    }
    console.log(`✓ Migrated ${mongoParishes.length} parishes\n`);

    // Migrate Businesses with ID mapping
    console.log('Migrating Businesses...');
    const mongoBusinesses = await MongoBusiness.find({}).lean();
    const businessIdMap = {}; // Map MongoDB _id to MySQL id
    
    for (const business of mongoBusinesses) {
      const newBusiness = await Business.create({
        name: business.name,
        address: business.address,
        street: business.street,
        city: business.city,
        state: business.state,
        zip: business.zip,
        lat: business.lat,
        lng: business.lng,
        owner: business.owner,
        phone: business.phone,
        email: business.email,
        website: business.website,
        category: business.category,
        description: business.description,
        tags: business.tags || [],
        parishId: business.parishId ? parishIdMap[business.parishId.toString()] : null,
        verified: business.verified,
        sponsored: business.sponsored,
        imageUrl: business.imageUrl,
        hasWifi: business.hasWifi,
        familyFriendly: business.familyFriendly,
        hasParking: business.hasParking,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt
      });
      businessIdMap[business._id.toString()] = newBusiness.id;
    }
    console.log(`✓ Migrated ${mongoBusinesses.length} businesses\n`);

    // Migrate Submissions
    console.log('Migrating Submissions...');
    const mongoSubmissions = await MongoSubmission.find({}).lean();
    
    for (const submission of mongoSubmissions) {
      await Submission.create({
        name: submission.name,
        address: submission.address,
        street: submission.street,
        city: submission.city,
        state: submission.state,
        zip: submission.zip,
        owner: submission.owner,
        phone: submission.phone,
        email: submission.email,
        website: submission.website,
        category: submission.category,
        description: submission.description,
        tags: submission.tags,
        parishId: submission.parishId ? parishIdMap[submission.parishId.toString()] : null,
        parishName: submission.parishName,
        imageUrl: submission.imageUrl,
        hasWifi: submission.hasWifi,
        familyFriendly: submission.familyFriendly,
        hasParking: submission.hasParking,
        status: submission.status,
        submittedAt: submission.submittedAt,
        reviewedAt: submission.reviewedAt,
        reviewedBy: submission.reviewedBy ? parishIdMap[submission.reviewedBy.toString()] : null,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      });
    }
    console.log(`✓ Migrated ${mongoSubmissions.length} submissions\n`);

    // Migrate Analytics
    console.log('Migrating Analytics...');
    const mongoAnalytics = await MongoAnalytics.find({}).lean();
    
    for (const analytic of mongoAnalytics) {
      await Analytics.create({
        businessId: businessIdMap[analytic.businessId.toString()],
        businessName: analytic.businessName,
        eventType: analytic.eventType,
        tag: analytic.tag,
        userLocationLat: analytic.userLocation?.lat || null,
        userLocationLng: analytic.userLocation?.lng || null,
        timestamp: analytic.timestamp,
        createdAt: analytic.createdAt,
        updatedAt: analytic.updatedAt
      });
    }
    console.log(`✓ Migrated ${mongoAnalytics.length} analytics events\n`);

    // Close connections
    await mongoose.connection.close();
    await sequelize.close();

    console.log('=== Migration Complete ===');
    console.log(`Total records migrated:`);
    console.log(`  - Admins: ${mongoAdmins.length}`);
    console.log(`  - Parishes: ${mongoParishes.length}`);
    console.log(`  - Businesses: ${mongoBusinesses.length}`);
    console.log(`  - Submissions: ${mongoSubmissions.length}`);
    console.log(`  - Analytics: ${mongoAnalytics.length}`);
    console.log(`\nYou can now switch to the MySQL database!`);

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateData();
