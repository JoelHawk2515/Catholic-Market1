// server.js - MySQL version
require('dotenv').config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const multer = require('multer');
const fs = require('fs');
const webpush = require('web-push');
const connectDB = require("./db");
const cron = require('node-cron');

// Import models
const { sequelize, Admin, Parish, Business, Submission, Analytics, PushSubscription, SpotlightConfig, SpotlightQueue } = require('./models-sequelize');
const { Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3200;

// Connect to MySQL
connectDB();

// Configure web-push VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@catholicmarket.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✓ Web Push configured');
}

// Ensure business-images directory exists
const uploadDir = path.join(__dirname, 'public', 'business-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get business name from form data and sanitize it
    const businessName = req.body.name || 'business';
    const sanitizedName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);

    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();

    // Create filename: businessname-timestamp.ext
    cb(null, `${sanitizedName}-${Date.now()}${ext}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with MySQL store
app.use(session({
  secret: process.env.SESSION_SECRET || "catholic-market-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: new SequelizeStore({
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 24 * 60 * 60 * 1000 // 24 hours
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Admin login page route
app.get("/admin", (req, res) => {
  if (req.session.adminId) {
    res.redirect("/admin/dashboard.html");
  } else {
    res.sendFile(path.join(__dirname, "public", "admin", "login.html"));
  }
});

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Admin authentication routes
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', username);

    const admin = await Admin.findOne({ where: { username: username.toLowerCase(), active: true } });

    if (!admin) {
      console.log('Admin not found for username:', username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log('Admin found:', admin.id, admin.username);

    const isMatch = await admin.comparePassword(password);

    console.log('Password match:', isMatch);

    if (isMatch) {
      req.session.adminId = admin.id.toString();
      console.log('Login successful, session ID:', req.session.adminId);
      res.json({ success: true });
    } else {
      console.log('Password mismatch for user:', username);
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/admin/check", requireAdmin, (req, res) => {
  res.json({ success: true });
});

// Business submission (public) with image upload
app.post("/api/submissions", upload.single('image'), async (req, res) => {
  try {
    // Get image URL if file was uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/business-images/${req.file.filename}`;
    }

    const submission = await Submission.create({
      name: req.body.name,
      address: req.body.address,
      street: req.body.street || null,
      city: req.body.city || null,
      state: req.body.state || null,
      zip: req.body.zip || null,
      owner: req.body.owner || null,
      phone: req.body.phone || null,
      email: req.body.email || null,
      website: req.body.website || null,
      category: req.body.category || null,
      description: req.body.description || null,
      tags: req.body.tags || '',
      parishId: req.body.parishId || null,
      parishName: req.body.parishName || null,
      imageUrl: imageUrl,
      isOpen247: req.body.isOpen247 === 'true',
      hasWifi: req.body.hasWifi === 'true',
      familyFriendly: req.body.familyFriendly === 'true',
      hasParking: req.body.hasParking === 'true',
      schedule: req.body.schedule ? JSON.parse(req.body.schedule) : null,
      status: 'pending'
    });

    res.json({ success: true, message: "Submission received and pending review" });
  } catch (error) {
    console.error('Submission error:', error);

    // Clean up uploaded file if submission fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ error: error.message || "Failed to submit business" });
  }
});

// Admin: Get pending submissions
app.get("/api/admin/submissions/pending", requireAdmin, async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      where: { status: 'pending' },
      order: [['submittedAt', 'DESC']]
    });

    // Format for frontend (convert to plain objects with id)
    const formatted = submissions.map(sub => ({
      ...sub.toJSON(),
      id: sub.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Admin: Approve submission
app.post("/api/admin/submissions/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified = true } = req.body;

    const submission = await Submission.findByPk(id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Convert tags string to array
    const tagsArray = submission.tags
      ? submission.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Create new business
    const business = await Business.create({
      name: submission.name,
      address: submission.address,
      street: submission.street || null,
      city: submission.city || null,
      state: submission.state || null,
      zip: submission.zip || null,
      lat: null, // Will be geocoded
      lng: null,
      owner: submission.owner,
      phone: submission.phone,
      email: submission.email,
      website: submission.website,
      category: submission.category,
      description: submission.description,
      tags: tagsArray,
      parishId: submission.parishId,
      imageUrl: submission.imageUrl,
      isOpen247: submission.isOpen247 || false,
      hasWifi: submission.hasWifi || false,
      familyFriendly: submission.familyFriendly || false,
      hasParking: submission.hasParking || false,
      schedule: submission.schedule || null,
      verified: verified
    });

    await business.save();

    // Geocode the address immediately after approval
    try {
      // Build a more complete address string for better geocoding accuracy
      let fullAddress = submission.address;
      if (submission.city || submission.state || submission.zip) {
        const parts = [submission.address];
        if (submission.city) parts.push(submission.city);
        if (submission.state) parts.push(submission.state);
        if (submission.zip) parts.push(submission.zip);
        fullAddress = parts.join(', ');
      }

      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        business.lat = coords.lat;
        business.lng = coords.lng;
        business.street = coords.street || submission.street;
        business.city = coords.city || submission.city;
        business.state = coords.state || submission.state;
        business.zip = coords.zip || submission.zip;
        await business.save();
        console.log(`Geocoded business "${business.name}": ${coords.displayName}`);
      }
    } catch (geocodeError) {
      console.error('Failed to geocode approved business:', geocodeError);
      // Continue anyway - the business is still created, just without coordinates
    }

    // Update submission status
    submission.status = 'approved';
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.session.adminId;
    await submission.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: "Failed to approve submission" });
  }
});

// Admin: Reject submission
app.post("/api/admin/submissions/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findByPk(id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    submission.status = 'rejected';
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.session.adminId;
    await submission.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ error: "Failed to reject submission" });
  }
});

// Admin: Bulk upload businesses from CSV
app.post("/api/admin/bulk-upload", requireAdmin, async (req, res) => {
  try {
    const { businesses } = req.body;

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return res.status(400).json({ error: "No business data provided" });
    }

    let created = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i];

      // Skip rows missing required fields
      if (!b.name || !b.address || !b.city) {
        failed++;
        errors.push({ row: i + 1, error: 'Missing required field (name, address, or city)' });
        continue;
      }

      try {
        // Convert tags from semicolons to comma-separated
        let tagsStr = '';
        if (b.tags) {
          tagsStr = b.tags.split(';').map(t => t.trim()).filter(Boolean).join(', ');
        }

        await Submission.create({
          name: b.name,
          address: b.address,
          street: b.street || null,
          city: b.city || null,
          state: b.state || null,
          zip: b.zip || null,
          owner: b.owner || null,
          phone: b.phone || null,
          email: b.email || null,
          website: b.website || null,
          category: b.category || null,
          description: b.description || null,
          tags: tagsStr,
          hasWifi: String(b.hasWifi).toLowerCase() === 'true',
          familyFriendly: String(b.familyFriendly).toLowerCase() === 'true',
          hasParking: String(b.hasParking).toLowerCase() === 'true',
          imageUrl: null,
          schedule: null,
          status: 'pending'
        });

        created++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, error: err.message || 'Unknown error' });
      }
    }

    console.log(`Bulk upload complete: ${created} created, ${failed} failed`);
    res.json({ created, failed, errors: errors.slice(0, 20) }); // Cap error list at 20
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: "Bulk upload failed" });
  }
});

// Admin: Bulk upload parishes from CSV
app.post("/api/admin/bulk-upload-parishes", requireAdmin, async (req, res) => {
  try {
    const { parishes } = req.body;

    if (!parishes || !Array.isArray(parishes) || parishes.length === 0) {
      return res.status(400).json({ error: "No parish data provided" });
    }

    let created = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < parishes.length; i++) {
      const p = parishes[i];

      if (!p.name || !p.address || !p.city || !p.state) {
        failed++;
        errors.push({ row: i + 1, error: 'Missing required field (name, address, city, or state)' });
        continue;
      }

      try {
        await Parish.create({
          name: p.name,
          address: p.address,
          street: p.street || null,
          city: p.city,
          state: p.state,
          zip: p.zip || null,
          phone: p.phone || null,
          website: p.website || null,
          lat: p.lat ? parseFloat(p.lat) : null,
          lng: p.lng ? parseFloat(p.lng) : null
        });

        created++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, error: err.message || 'Unknown error' });
      }
    }

    console.log(`Bulk parish upload complete: ${created} created, ${failed} failed`);
    res.json({ created, failed, errors: errors.slice(0, 20) });
  } catch (error) {
    console.error('Bulk parish upload error:', error);
    res.status(500).json({ error: "Bulk parish upload failed" });
  }
});

// Admin: Get approved businesses
app.get("/api/admin/businesses/approved", requireAdmin, async (req, res) => {
  try {
    const businesses = await Business.findAll({ order: [['createdAt', 'DESC']] });

    // Format for frontend
    const formatted = businesses.map(biz => ({
      ...biz.toJSON(),
      id: biz.id.toString(),
      tags: Array.isArray(biz.tags) ? biz.tags.join(', ') : (biz.tags || '')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

// Admin: Create new business
app.post("/api/admin/businesses", requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, address, street, city, state, zip, owner, phone, email, website, category, description, verified, isOpen247, hasWifi, familyFriendly, hasParking, schedule } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }

    const business = await Business.create({
      name,
      address,
      street: street || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      owner: owner || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      category: category || 'General',
      description: description || null,
      verified: verified === 'true',
      isOpen247: isOpen247 === 'true',
      hasWifi: hasWifi === 'true',
      familyFriendly: familyFriendly === 'true',
      hasParking: hasParking === 'true',
      schedule: schedule ? JSON.parse(schedule) : null,
      lat: null,
      lng: null,
      imageUrl: req.file ? `/business-images/${req.file.filename}` : null,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)) : (category ? [category] : [])
    });

    // Geocode the address immediately after creation
    try {
      let fullAddress = address;
      if (city || state || zip) {
        const parts = [address];
        if (city) parts.push(city);
        if (state) parts.push(state);
        if (zip) parts.push(zip);
        fullAddress = parts.join(', ');
      }

      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        business.lat = coords.lat;
        business.lng = coords.lng;
        business.street = coords.street || street;
        business.city = coords.city || city;
        business.state = coords.state || state;
        business.zip = coords.zip || zip;
        await business.save();
        console.log(`Geocoded business "${business.name}": ${coords.displayName}`);
      }
    } catch (geocodeError) {
      console.error('Failed to geocode new business:', geocodeError);
      // Continue anyway - the business is still created, just without coordinates
    }

    res.json({ success: true, id: business.id });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ error: "Failed to create business" });
  }
});

// Admin: Toggle verify business
app.post("/api/admin/businesses/:id/verify", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    business.verified = verified;
    await business.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: "Failed to update verification" });
  }
});

// Admin: Toggle sponsor business
app.post("/api/admin/businesses/:id/sponsor", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsored } = req.body;

    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    business.sponsored = sponsored;
    await business.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Sponsor error:', error);
    res.status(500).json({ error: "Failed to update sponsor status" });
  }
});

// Admin: Update business
app.patch("/api/admin/businesses/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, street, city, state, zip, lat, lng, owner, phone, email, website, category, parishId, description, tags, isOpen247, hasWifi, familyFriendly, hasParking, schedule } = req.body;

    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const needsRegeocode = (
      (address !== undefined && address !== business.address) ||
      (city !== undefined && city !== business.city) ||
      (state !== undefined && state !== business.state) ||
      (zip !== undefined && zip !== business.zip)
    );

    // Update fields
    if (name !== undefined) business.name = name;
    if (address !== undefined) business.address = address;
    if (street !== undefined) business.street = street;
    if (city !== undefined) business.city = city;
    if (state !== undefined) business.state = state;
    if (zip !== undefined) business.zip = zip;
    if (lat !== undefined) business.lat = lat;
    if (lng !== undefined) business.lng = lng;
    if (owner !== undefined) business.owner = owner;
    if (phone !== undefined) business.phone = phone;
    if (email !== undefined) business.email = email;
    if (website !== undefined) business.website = website;
    if (category !== undefined) business.category = category;
    if (parishId !== undefined) business.parishId = parishId === "" ? null : parishId;
    if (description !== undefined) business.description = description;
    if (isOpen247 !== undefined) business.isOpen247 = isOpen247;
    if (hasWifi !== undefined) business.hasWifi = hasWifi;
    if (familyFriendly !== undefined) business.familyFriendly = familyFriendly;
    if (hasParking !== undefined) business.hasParking = hasParking;
    if (schedule !== undefined) business.schedule = schedule;
    if (tags !== undefined) business.tags = tags;

    await business.save();

    // If address was updated, re-geocode
    if (needsRegeocode) {
      try {
        let fullAddress = business.address;
        if (business.city || business.state || business.zip) {
          const parts = [business.address];
          if (business.city) parts.push(business.city);
          if (business.state) parts.push(business.state);
          if (business.zip) parts.push(business.zip);
          fullAddress = parts.join(', ');
        }

        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          business.lat = coords.lat;
          business.lng = coords.lng;
          // Keep manual updates; fallback to geocoded values only if empty
          business.street = business.street || coords.street;
          business.city = business.city || coords.city;
          business.state = business.state || coords.state;
          business.zip = business.zip || coords.zip;
          await business.save();
          console.log(`Re-geocoded business "${business.name}": ${coords.displayName}`);
        }
      } catch (geocodeError) {
        console.error('Failed to re-geocode business:', geocodeError);
        // Continue anyway
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: "Failed to update business" });
  }
});

// Admin: Update business image
app.post("/api/admin/businesses/:id/image", requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Update image URL
    const imageUrl = `/business-images/${req.file.filename}`;
    business.imageUrl = imageUrl;

    await business.save();

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Admin: Delete business
app.delete("/api/admin/businesses/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findByPk(id);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Delete related analytics records first (FK constraint)
    await Analytics.destroy({ where: { businessId: id } });

    await business.destroy();

    console.log(`Deleted business "${business.name}" (id: ${id}) and its analytics`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: "Failed to delete business" });
  }
});

// API: fetch all businesses (statewide display)
app.get("/api/businesses", async (req, res) => {
  try {
    const businesses = await Business.findAll({
      where: {
        lat: { [Op.not]: null },
        lng: { [Op.not]: null }
      }
    });

    console.log(`Found ${businesses.length} businesses for map`);

    // Format for frontend
    const formatted = businesses.map(biz => ({
      ...biz.toJSON(),
      id: biz.id.toString(),
      lat: biz.lat ? parseFloat(biz.lat) : null,
      lng: biz.lng ? parseFloat(biz.lng) : null,
      tags: Array.isArray(biz.tags) ? biz.tags.join(', ') : ''
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

// API: fetch all parishes (statewide display)
app.get("/api/parishes", async (req, res) => {
  try {
    const parishes = await Parish.findAll({
      where: {
        lat: { [Op.not]: null },
        lng: { [Op.not]: null }
      }
    });

    console.log(`Found ${parishes.length} parishes for map`);

    // Format for frontend
    const formatted = parishes.map(parish => ({
      ...parish.toJSON(),
      id: parish.id.toString(),
      lat: parish.lat ? parseFloat(parish.lat) : null,
      lng: parish.lng ? parseFloat(parish.lng) : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching parishes:', error);
    res.status(500).json({ error: "Failed to fetch parishes" });
  }
});

// API: fetch all parishes (public, for form dropdowns)
app.get("/api/parishes/all", async (req, res) => {
  try {
    const parishes = await Parish.findAll({
      order: [["name", "ASC"]]
    });

    const formatted = parishes.map(parish => ({
      ...parish.toJSON(),
      id: parish.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching all parishes:', error);
    res.status(500).json({ error: "Failed to fetch parishes" });
  }
});

// Public: Get parishes by city name (for Add Business form parish lookup)
app.get("/api/parishes/city/:city", async (req, res) => {
  try {
    const city = req.params.city;
    const parishes = await Parish.findAll({
      where: {
        city: { [Op.like]: `%${city}%` }
      },
      order: [['name', 'ASC']]
    });

    const formatted = parishes.map(parish => ({
      ...parish.toJSON(),
      id: parish.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching parishes by city:', error);
    res.status(500).json({ error: "Failed to fetch parishes" });
  }
});

// Admin: Get all parishes
app.get("/api/admin/parishes", requireAdmin, async (req, res) => {
  try {
    const parishes = await Parish.findAll({ order: [['name', 'ASC']] });

    const formatted = parishes.map(parish => ({
      ...parish.toJSON(),
      id: parish.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching parishes:', error);
    res.status(500).json({ error: "Failed to fetch parishes" });
  }
});

// Admin: Create new parish
app.post("/api/admin/parishes", requireAdmin, async (req, res) => {
  try {
    const { name, address, street, city, state, zip, website, massTimes } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }

    const parish = await Parish.create({
      name,
      address,
      street: street || null,
      city: city || 'Unknown',
      state: state || 'Unknown',
      zip: zip || null,
      website: website || null,
      massTimes: massTimes || null,
      lat: null,
      lng: null
    });

    res.json({ success: true, id: parish.id });
  } catch (error) {
    console.error('Create parish error:', error);
    res.status(500).json({ error: "Failed to create parish" });
  }
});

// Admin: Update parish
app.patch("/api/admin/parishes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, street, city, state, zip, phone, website, lat, lng } = req.body;

    const parish = await Parish.findByPk(id);

    if (!parish) {
      return res.status(404).json({ error: "Parish not found" });
    }

    if (name !== undefined) parish.name = name;
    if (address !== undefined) parish.address = address;
    if (street !== undefined) parish.street = street;
    if (city !== undefined) parish.city = city;
    if (state !== undefined) parish.state = state;
    if (zip !== undefined) parish.zip = zip;
    if (phone !== undefined) parish.phone = phone;
    if (website !== undefined) parish.website = website;
    if (lat !== undefined) parish.lat = lat;
    if (lng !== undefined) parish.lng = lng;

    await parish.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: "Failed to update parish" });
  }
});

// Admin: Delete parish
app.delete("/api/admin/parishes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const parish = await Parish.findByPk(id);

    if (!parish) {
      return res.status(404).json({ error: "Parish not found" });
    }

    // Nullify parishId on related businesses and submissions (FK constraints)
    await Business.update({ parishId: null }, { where: { parishId: id } });
    await Submission.update({ parishId: null }, { where: { parishId: id } });

    await parish.destroy();

    console.log(`Deleted parish "${parish.name}" (id: ${id})`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: "Failed to delete parish" });
  }
});

// Admin: Geocode all businesses and parishes missing coordinates
app.post("/api/admin/geocode-all", requireAdmin, async (req, res) => {
  try {
    let businessesUpdated = 0;
    let parishesUpdated = 0;

    // Geocode businesses without coordinates
    const businessesNeedingGeocode = await Business.findAll({
      where: {
        [Op.or]: [
          { lat: null },
          { lng: null }
        ]
      }
    });

    for (const business of businessesNeedingGeocode) {
      try {
        // Build a more complete address string for better geocoding accuracy
        let fullAddress = business.address;
        if (business.city || business.state || business.zip) {
          const parts = [business.address];
          if (business.city) parts.push(business.city);
          if (business.state) parts.push(business.state);
          if (business.zip) parts.push(business.zip);
          fullAddress = parts.join(', ');
        }

        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          business.lat = coords.lat;
          business.lng = coords.lng;
          business.street = coords.street || business.street;
          business.city = coords.city || business.city;
          business.state = coords.state || business.state;
          business.zip = coords.zip || business.zip;
          await business.save();
          businessesUpdated++;
          console.log(`Geocoded business "${business.name}": ${coords.displayName}`);
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
      } catch (err) {
        console.error(`Failed to geocode business ${business.name}:`, err.message);
      }
    }

    // Geocode parishes without coordinates
    const parishesNeedingGeocode = await Parish.findAll({
      where: {
        [Op.or]: [
          { lat: null },
          { lng: null }
        ]
      }
    });

    for (const parish of parishesNeedingGeocode) {
      try {
        // Build a more complete address string for better geocoding accuracy
        let fullAddress = parish.address;
        if (parish.city || parish.state || parish.zip) {
          const parts = [parish.address];
          if (parish.city) parts.push(parish.city);
          if (parish.state) parts.push(parish.state);
          if (parish.zip) parts.push(parish.zip);
          fullAddress = parts.join(', ');
        }

        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          parish.lat = coords.lat;
          parish.lng = coords.lng;
          parish.street = coords.street || parish.street;
          parish.city = coords.city || parish.city;
          parish.state = coords.state || parish.state;
          parish.zip = coords.zip || parish.zip;
          await parish.save();
          parishesUpdated++;
          console.log(`Geocoded parish "${parish.name}": ${coords.displayName}`);
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
      } catch (err) {
        console.error(`Failed to geocode parish ${parish.name}:`, err.message);
      }
    }

    res.json({
      success: true,
      businessesUpdated,
      parishesUpdated
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: "Failed to geocode addresses" });
  }
});

// Helper function to geocode an address using Geoapify
async function geocodeAddress(address) {
  try {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      console.warn('GEOAPIFY_API_KEY is not set. Skipping geocoding.');
      return null;
    }

    const url = new URL("https://api.geoapify.com/v1/geocode/search");
    url.searchParams.append("text", address);
    url.searchParams.append("apiKey", apiKey);
    url.searchParams.append("limit", "1");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Geoapify geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates; // [lng, lat] format

      const result = {
        lat: coords[1],
        lng: coords[0],
        street: props.street || null,
        city: props.city || null,
        state: props.state_code || props.state || null,
        zip: props.postcode || null,
        displayName: props.formatted || address
      };

      console.log(`Geoapify geocoded: ${address} -> ${result.displayName}`);
      return result;
    }

    return null;
  } catch (err) {
    console.error('Geoapify geocoding failed:', err.message);
    return null;
  }
}

// API: fetch parishes by city
app.get("/api/parishes/city/:cityName", async (req, res) => {
  try {
    const cityName = req.params.cityName;

    const parishes = await Parish.find({
      city: new RegExp(`^${cityName}$`, 'i') // Case-insensitive match
    }).lean();

    // Format for frontend
    const formatted = parishes.map(parish => ({
      ...parish.toJSON(),
      id: parish.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching parishes:', error);
    res.status(500).json({ error: "Failed to fetch parishes" });
  }
});

// API: fetch sponsored businesses for homepage rotator
app.get("/api/businesses/sponsored", async (req, res) => {
  try {
    const sponsored = await Business.findAll({
      where: {
        sponsored: true,
        verified: true // Only show verified sponsored businesses
      },
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${sponsored.length} sponsored businesses:`, sponsored.map(b => ({ id: b.id, name: b.name, sponsored: b.sponsored, verified: b.verified })));

    const formatted = sponsored.map(biz => ({
      ...biz.toJSON(),
      id: biz.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching sponsored businesses:', error);
    res.status(500).json({ error: "Failed to fetch sponsored businesses" });
  }
});

// Analytics: Track business interactions
app.post("/api/analytics/track", async (req, res) => {
  try {
    const { businessId, businessName, eventType, tag, userLocation } = req.body;

    if (!businessId || !businessName || !eventType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const analytics = await Analytics.create({
      businessId,
      businessName,
      eventType,
      tag: tag || null,
      userLocationLat: userLocation?.lat || null,
      userLocationLng: userLocation?.lng || null,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: "Failed to track event" });
  }
});

// Analytics: Get popular businesses near user (last 7 days)
app.get("/api/analytics/popular", async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({ error: "Location required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all businesses (verified or not)
    const businesses = await Business.findAll();

    // Filter businesses within radius and get their click counts
    const businessesInRadius = [];

    for (const business of businesses) {
      if (business.lat && business.lng) {
        const distance = getDistanceFromLatLonInKm(
          userLat, userLng,
          business.lat, business.lng
        );

        if (distance <= radius) {
          // Count ALL clicks for this business in last 7 days (card, directions, website)
          const clickCount = await Analytics.count({
            where: {
              businessId: business.id,
              eventType: { [Op.in]: ['card_click', 'directions_click', 'website_click'] },
              timestamp: { [Op.gte]: sevenDaysAgo }
            }
          });

          businessesInRadius.push({
            ...business.toJSON(),
            id: business.id.toString(),
            clickCount,
            distance
          });
        }
      }
    }

    // Sort by click count (most popular first), then by distance
    businessesInRadius.sort((a, b) => {
      if (b.clickCount !== a.clickCount) {
        return b.clickCount - a.clickCount;
      }
      return a.distance - b.distance;
    });

    // Return top 7 popular businesses
    res.json(businessesInRadius.slice(0, 7));
  } catch (error) {
    console.error('Popular businesses error:', error);
    res.status(500).json({ error: "Failed to fetch popular businesses" });
  }
});

// Helper function to calculate distance between two coordinates in miles
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in miles
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// ============================================
// PUSH NOTIFICATION ROUTES
// ============================================

// Public: Get VAPID public key
app.get("/api/push/vapid-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Public: Subscribe to push notifications
app.post("/api/push/subscribe", async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }

    // Upsert subscription (update if endpoint exists, create if not)
    await PushSubscription.upsert({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// Admin: Send spotlight notification
app.post("/api/admin/spotlight", requireAdmin, async (req, res) => {
  try {
    const { businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: "Business ID required" });
    }

    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Get all push subscriptions
    const subscriptions = await PushSubscription.findAll();

    if (subscriptions.length === 0) {
      return res.json({ success: true, sent: 0, failed: 0, message: "No subscribers yet" });
    }

    const payload = JSON.stringify({
      title: '⭐ Business Spotlight of the Week!',
      body: `Check out ${business.name}! ${business.description || business.address}`,
      url: `/?spotlight=${business.id}`,
      businessId: business.id,
      imageUrl: business.imageUrl || undefined
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints = [];

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err) {
        failed++;
        // Remove expired/invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await PushSubscription.destroy({ where: { endpoint: expiredEndpoints } });
      console.log(`Removed ${expiredEndpoints.length} expired push subscriptions`);
    }

    console.log(`Spotlight sent for "${business.name}": ${sent} sent, ${failed} failed`);
    res.json({ success: true, sent, failed, businessName: business.name });
  } catch (error) {
    console.error('Spotlight error:', error);
    res.status(500).json({ error: "Failed to send spotlight" });
  }
});

// --- Spotlight Queue Routes ---

// Admin: Get Spotlight Config
app.get("/api/admin/spotlight-queue/config", requireAdmin, async (req, res) => {
  try {
    let config = await SpotlightConfig.findOne();
    if (!config) {
      config = await SpotlightConfig.create({ dayOfWeek: 1, timeOfDay: '12:00', isActive: true });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Failed to get spotlight config" });
  }
});

// Admin: Update Spotlight Config
app.post("/api/admin/spotlight-queue/config", requireAdmin, async (req, res) => {
  try {
    const { dayOfWeek, timeOfDay, isActive } = req.body;
    let config = await SpotlightConfig.findOne();
    if (!config) {
      config = await SpotlightConfig.create({ dayOfWeek, timeOfDay, isActive });
    } else {
      await config.update({ dayOfWeek, timeOfDay, isActive });
    }
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: "Failed to update spotlight config" });
  }
});

// Admin: Get Spotlight Queue
app.get("/api/admin/spotlight-queue", requireAdmin, async (req, res) => {
  try {
    const queue = await SpotlightQueue.findAll({
      include: [{ model: Business, as: 'business' }],
      order: [['orderIndex', 'ASC']]
    });
    // Format response to flatten the objects
    const formatted = queue.map(q => {
      const b = q.business ? q.business.toJSON() : null;
      return {
        id: q.id,
        businessId: q.businessId,
        orderIndex: q.orderIndex,
        businessName: b ? b.name : "Unknown",
        businessCity: b ? b.city : "Unknown"
      };
    });
    res.json(formatted);
  } catch (err) {
    console.error("Queue get error:", err);
    res.status(500).json({ error: "Failed to get spotlight queue" });
  }
});

// Admin: Add to Spotlight Queue
app.post("/api/admin/spotlight-queue", requireAdmin, async (req, res) => {
  try {
    const { businessId } = req.body;
    const exists = await SpotlightQueue.findOne({ where: { businessId } });
    if (exists) {
      return res.status(400).json({ error: "Business is already in the spotlight queue" });
    }

    // Find the max order
    const maxOrder = await SpotlightQueue.max('orderIndex') || 0;

    const item = await SpotlightQueue.create({ businessId, orderIndex: maxOrder + 1 });
    res.json({ success: true, item });
  } catch (err) {
    console.error("Queue add error:", err);
    res.status(500).json({ error: "Failed to add to queue" });
  }
});

// Admin: Reorder Spotlight Queue
app.post("/api/admin/spotlight-queue/reorder", requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body; // Array of SpotlightQueue IDs in new order
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "orderedIds array is required" });
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await SpotlightQueue.update({ orderIndex: i }, { where: { id: orderedIds[i] } });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Queue reorder error:", err);
    res.status(500).json({ error: "Failed to reorder queue" });
  }
});

// Admin: Remove from Spotlight Queue
app.delete("/api/admin/spotlight-queue/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await SpotlightQueue.destroy({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from queue" });
  }
});

// Automated logic to consume the queue and send
async function processSpotlightQueue() {
  try {
    const nextItem = await SpotlightQueue.findOne({
      include: [{ model: Business, as: 'business' }],
      order: [['orderIndex', 'ASC']]
    });

    if (!nextItem || !nextItem.business) {
      console.log('Spotlight Queue is empty or invalid, nothing sent.');
      if (nextItem) await nextItem.destroy();
      return;
    }

    const business = nextItem.business;

    // Check subscribers
    const subscriptions = await PushSubscription.findAll();
    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: '⭐ Business Spotlight of the Week!',
        body: `Check out ${business.name}! ${business.description || business.address}`,
        url: `/?spotlight=${business.id}`,
        businessId: business.id,
        imageUrl: business.imageUrl || undefined
      });

      const expiredEndpoints = [];
      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        const pushOptions = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        };
        try {
          await webpush.sendNotification(pushOptions, payload);
          sent++;
        } catch (err) {
          failed++;
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      }

      if (expiredEndpoints.length > 0) {
        await PushSubscription.destroy({ where: { endpoint: expiredEndpoints } });
      }
      console.log(`Automated Spotlight sent for "${business.name}" (${sent} sent, ${failed} failed)`);
    }

    // Burn the item from the queue
    await nextItem.destroy();

  } catch (err) {
    console.error('Process spotlight queue error:', err);
  }
}

// Ensure the automated spotlight only runs once per trigger window using a flag tracking the last run minute
let lastSpotlightRunMinute = -1;

cron.schedule('* * * * *', async () => {
  try {
    const config = await SpotlightConfig.findOne();
    if (!config || !config.isActive) return;

    const now = new Date();

    // Resolve standard local time details (America/Chicago timezone where the user resides)
    const options = { timeZone: 'America/Chicago', hour12: false, hour: '2-digit', minute: '2-digit', weekday: 'short' };
    const formatter = new Intl.DateTimeFormat('en-US', options);

    // A quick hack to extract day name and padded military time directly 
    // Usually yields something like: "Sat, 14:05" or "Saturday, 14:05"
    let localParts = formatter.formatToParts(now);

    let dHour = 0; let dMin = 0; let dWeek = 0;
    const weekMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    for (let p of localParts) {
      if (p.type === 'hour') dHour = p.value;
      if (p.type === 'minute') dMin = p.value;
      if (p.type === 'weekday') dWeek = weekMap[p.value];
    }

    const formattedTime = `${dHour}:${dMin}`;

    // If it is the correct minute...
    if (config.dayOfWeek === dWeek && config.timeOfDay === formattedTime) {
      if (lastSpotlightRunMinute !== dMin) {
        lastSpotlightRunMinute = dMin;
        await processSpotlightQueue();
      }
    }
  } catch (err) {
    console.error('Failed processing cron clock:', err);
  }
});

// Fallback: serve index.html for root
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✓ Server listening on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
