// server.js - MySQL version
require('dotenv').config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const multer = require('multer');
const fs = require('fs');
const connectDB = require("./db");

// Import models
const { sequelize, Admin, Parish, Business, Submission, Analytics } = require('./models-sequelize');
const { Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3200;

// Connect to MySQL
connectDB();

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

    const admin = await Admin.findOne({ where: { username: username.toLowerCase(), active: true } });

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await admin.comparePassword(password);

    if (isMatch) {
      req.session.adminId = admin.id.toString();
      res.json({ success: true });
    } else {
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
      hasWifi: req.body.hasWifi === 'true',
      familyFriendly: req.body.familyFriendly === 'true',
      hasParking: req.body.hasParking === 'true',
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
      hasWifi: submission.hasWifi || false,
      familyFriendly: submission.familyFriendly || false,
      hasParking: submission.hasParking || false,
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

// Admin: Get approved businesses
app.get("/api/admin/businesses/approved", requireAdmin, async (req, res) => {
  try {
    const businesses = await Business.findAll({ order: [["createdAt", "DESC"]] });

    // Format for frontend
    const formatted = businesses.map(biz => ({
      ...biz,
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
    const { name, address, street, city, state, zip, owner, phone, email, website, category, description, verified, hasWifi, familyFriendly, hasParking } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }

    const business = new Business({
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
      hasWifi: hasWifi === 'true',
      familyFriendly: familyFriendly === 'true',
      hasParking: hasParking === 'true',
      lat: null,
      lng: null,
      imageUrl: req.file ? `/business-images/${req.file.filename}` : null,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)) : (category ? [category] : [])
    });

    await business.save();

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
    const { name, address, street, city, state, zip, lat, lng, owner, phone, email, website, category, description, tags, hasWifi, familyFriendly, hasParking } = req.body;

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
    if (description !== undefined) business.description = description;
    if (hasWifi !== undefined) business.hasWifi = hasWifi;
    if (familyFriendly !== undefined) business.familyFriendly = familyFriendly;
    if (hasParking !== undefined) business.hasParking = hasParking;
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

    const result = await Business.destroy({ where: { id } });

    if (!result) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: "Failed to delete business" });
  }
});

// API: fetch businesses by bounding box
app.get("/api/businesses", async (req, res) => {
  try {
    const minLat = parseFloat(req.query.minLat);
    const minLng = parseFloat(req.query.minLng);
    const maxLat = parseFloat(req.query.maxLat);
    const maxLng = parseFloat(req.query.maxLng);

    if ([minLat, minLng, maxLat, maxLng].some(v => Number.isNaN(v))) {
      return res.status(400).json({
        error: "Missing or invalid bbox params. Expected minLat, minLng, maxLat, maxLng as numbers."
      });
    }

    const businesses = await Business.findAll({
      where: {
        lat: { [Op.between]: [minLat, maxLat] },
        lng: { [Op.between]: [minLng, maxLng] }
      },
      raw: true
    });

    // Format for frontend
    const formatted = businesses.map(biz => ({
      ...biz,
      id: biz.id.toString(),
      tags: Array.isArray(biz.tags) ? biz.tags.join(', ') : (biz.tags || '')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

// API: fetch parishes by bounding box
app.get("/api/parishes", async (req, res) => {
  try {
    const minLat = parseFloat(req.query.minLat);
    const minLng = parseFloat(req.query.minLng);
    const maxLat = parseFloat(req.query.maxLat);
    const maxLng = parseFloat(req.query.maxLng);

    if ([minLat, minLng, maxLat, maxLng].some(v => Number.isNaN(v))) {
      return res.status(400).json({
        error: "Missing or invalid bbox params. Expected minLat, minLng, maxLat, maxLng as numbers."
      });
    }

    const parishes = await Parish.findAll({
      where: {
        lat: { [Op.between]: [minLat, maxLat] },
        lng: { [Op.between]: [minLng, maxLng] }
      },
      raw: true
    });

    // Format for frontend
    const formatted = parishes.map(parish => ({
      ...parish,
      id: parish.id.toString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching parishes:', error);
    res.status(500).json({ error: "Failed to fetch parishes" });
  }
});

// Admin: Get all parishes
app.get("/api/admin/parishes", requireAdmin, async (req, res) => {
  try {
    const parishes = await Parish.findAll({ order: [["name", "ASC"]] });

    const formatted = parishes.map(parish => ({
      ...parish,
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

    const parish = new Parish({
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

    await parish.save();

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

    const result = await Parish.destroy({ where: { id } });

    if (!result) {
      return res.status(404).json({ error: "Parish not found" });
    }

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

// Helper function to geocode an address using multiple services for better accuracy
async function geocodeAddress(address) {
  // Try Photon first (more accurate than Nominatim)
  try {
    const photonResult = await geocodeWithPhoton(address);
    if (photonResult) {
      console.log(`Photon geocoded: ${address} -> ${photonResult.displayName}`);
      return photonResult;
    }
  } catch (err) {
    console.error('Photon geocoding failed:', err.message);
  }

  // Fallback to Nominatim
  try {
    const nominatimResult = await geocodeWithNominatim(address);
    if (nominatimResult) {
      console.log(`Nominatim geocoded: ${address} -> ${nominatimResult.displayName}`);
      return nominatimResult;
    }
  } catch (err) {
    console.error('Nominatim geocoding failed:', err.message);
  }

  return null;
}

// Geocode using Photon (Komoot's geocoding service - more accurate)
async function geocodeWithPhoton(address) {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.append("q", address);
    url.searchParams.append("limit", "1");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Photon geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates; // [lng, lat] format

      return {
        lat: coords[1],
        lng: coords[0],
        street: props.street || props.name || null,
        city: props.city || null,
        state: props.state || null,
        zip: props.postcode || null,
        displayName: props.name ? `${props.name}, ${props.city || ''}, ${props.state || ''}` : address
      };
    }

    return null;
  } catch (error) {
    throw error;
  }
}

// Geocode using Nominatim as fallback
async function geocodeWithNominatim(address) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.append("q", address);
    url.searchParams.append("format", "json");
    url.searchParams.append("addressdetails", "1");
    url.searchParams.append("limit", "1");

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CatholicMarket/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      const addr = result.address || {};

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        street: addr.road || addr.street || null,
        city: addr.city || addr.town || addr.village || addr.municipality || null,
        state: addr.state || null,
        zip: addr.postcode || null,
        displayName: result.display_name
      };
    }

    return null;
  } catch (error) {
    throw error;
  }
}

// API: fetch parishes by city
app.get("/api/parishes/city/:cityName", async (req, res) => {
  try {
    const cityName = req.params.cityName;

    const parishes = await Parish.findAll({
      where: {
        city: cityName
      },
      raw: true
    });

    // Format for frontend
    const formatted = parishes.map(parish => ({
      ...parish,
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
      raw: true
    });

    const formatted = sponsored.map(biz => ({
      ...biz,
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

    const analytics = new Analytics({
      businessId,
      businessName,
      eventType,
      tag: tag || null,
      userLocation: userLocation || null
    });

    await analytics.save();
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

    // Get all verified businesses
    const businesses = await Business.findAll({ where: { verified: true } });

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
            ...business,
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

    // Return top 10 popular businesses
    res.json(businessesInRadius.slice(0, 10));
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

// Fallback: serve index.html for root
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✓ Server listening on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
