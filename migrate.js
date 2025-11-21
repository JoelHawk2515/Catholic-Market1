// migrate.js - Migration script to transfer data from data.js to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Business = require('./models/Business');
const Parish = require('./models/Parish');
const Admin = require('./models/Admin');
const oldData = require('./data');

async function migrate() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('\n🚀 Starting migration...\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Business.deleteMany({});
    await Parish.deleteMany({});
    await Admin.deleteMany({});
    console.log('✓ Existing data cleared\n');
    
    // Migrate parishes first (businesses reference parishes)
    console.log('⛪ Migrating parishes...');
    const parishMap = new Map(); // Map old ID to new ObjectId
    
    for (const oldParish of oldData.parishes) {
      const parish = new Parish({
        name: oldParish.name,
        address: oldParish.address,
        city: oldParish.city,
        state: oldParish.state,
        lat: oldParish.lat,
        lng: oldParish.lng,
        phone: oldParish.phone || null,
        website: oldParish.website || null
      });
      
      const savedParish = await parish.save();
      parishMap.set(oldParish.id, savedParish._id);
      console.log(`  ✓ ${oldParish.name}`);
    }
    console.log(`✓ Migrated ${oldData.parishes.length} parishes\n`);
    
    // Migrate businesses
    console.log('🏢 Migrating businesses...');
    
    for (const oldBiz of oldData.businesses) {
      // Convert tags string to array
      const tagsArray = oldBiz.tags 
        ? oldBiz.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];
      
      // Map old parishId to new ObjectId
      const newParishId = oldBiz.parishId ? parishMap.get(oldBiz.parishId) : null;
      
      const business = new Business({
        name: oldBiz.name,
        address: oldBiz.address,
        lat: oldBiz.lat,
        lng: oldBiz.lng,
        owner: oldBiz.owner || null,
        phone: oldBiz.phone || null,
        email: oldBiz.email || null,
        website: oldBiz.website || null,
        category: oldBiz.category || null,
        description: oldBiz.description || null,
        tags: tagsArray,
        parishId: newParishId,
        verified: oldBiz.verified || false,
        imageUrl: oldBiz.imageUrl || null
      });
      
      await business.save();
      console.log(`  ✓ ${oldBiz.name}`);
    }
    console.log(`✓ Migrated ${oldData.businesses.length} businesses\n`);
    
    // Create default admin account
    console.log('👤 Creating admin account...');
    const admin = new Admin({
      username: 'admin',
      password: 'admin123', // This will be hashed by the pre-save hook
      email: null,
      role: 'superadmin',
      active: true
    });
    
    await admin.save();
    console.log('✓ Admin account created (username: admin, password: admin123)\n');
    
    console.log('✅ Migration completed successfully!\n');
    console.log('Summary:');
    console.log(`  - ${oldData.parishes.length} parishes migrated`);
    console.log(`  - ${oldData.businesses.length} businesses migrated`);
    console.log(`  - 1 admin account created`);
    console.log('\n💡 You can now start the server with: npm start\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
