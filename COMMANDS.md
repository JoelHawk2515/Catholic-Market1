# Command Reference

## 📦 Installation

```bash
# Install all dependencies
npm install
```

---

## 🗄️ Database Management

```bash
# Run migration (first time setup or data reset)
npm run migrate

# This will:
# - Connect to MongoDB
# - Clear existing data
# - Migrate parishes from data.js
# - Migrate businesses from data.js
# - Create default admin account
```

---

## 🚀 Running the Server

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

**Server will run on:** `http://localhost:3200`

---

## 🧪 Testing Endpoints

### Public Endpoints

```bash
# Get businesses in bounding box
curl "http://localhost:3200/api/businesses?minLat=37.65&minLng=-97.5&maxLat=37.75&maxLng=-97.2"

# Get parishes in bounding box
curl "http://localhost:3200/api/parishes?minLat=37.65&minLng=-97.5&maxLat=37.75&maxLng=-97.2"

# Get parishes by city
curl "http://localhost:3200/api/parishes/city/Wichita"

# Submit a business (POST)
curl -X POST http://localhost:3200/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "address": "123 Test St, Wichita, KS",
    "owner": "John Doe",
    "phone": "(316) 555-0000",
    "email": "test@example.com",
    "category": "Test Category",
    "description": "A test business"
  }'
```

### Admin Endpoints (requires authentication)

```bash
# Login as admin
curl -X POST http://localhost:3200/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -c cookies.txt

# Check auth status
curl http://localhost:3200/api/admin/check -b cookies.txt

# Get pending submissions
curl http://localhost:3200/api/admin/submissions/pending -b cookies.txt

# Get approved businesses
curl http://localhost:3200/api/admin/businesses/approved -b cookies.txt

# Logout
curl -X POST http://localhost:3200/api/admin/logout -b cookies.txt
```

---

## 🔧 MongoDB Management

### Using MongoDB Compass (GUI)
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect using the URI from `.env`
3. Browse collections: admins, businesses, parishes, submissions, sessions

### Using MongoDB Shell
```bash
# Connect to MongoDB
mongosh "mongodb+srv://jqelpadgett_db_user:EsMrBfO7Wyth6e0I@market.gacxc2i.mongodb.net/catholicMarket"

# List collections
show collections

# View businesses
db.businesses.find().pretty()

# Count documents
db.businesses.countDocuments()
db.parishes.countDocuments()

# Find verified businesses
db.businesses.find({ verified: true }).pretty()

# Find pending submissions
db.submissions.find({ status: "pending" }).pretty()

# Exit
exit
```

---

## 🔐 Admin Account Management

### Change Admin Password (via MongoDB Shell)

```javascript
// Connect to MongoDB first
use catholicMarket

// Update password (will be hashed on next login attempt - need to update manually)
// Better: Create a password reset script or use the admin dashboard

// For now, to reset admin password, re-run migration:
npm run migrate
```

### Create Additional Admin Account (MongoDB Shell)

```javascript
use catholicMarket

// Note: Password needs to be pre-hashed with bcrypt
// Use an online bcrypt generator or Node.js script
db.admins.insertOne({
  username: "newadmin",
  password: "$2a$10$hashedPasswordHere",
  email: "admin@example.com",
  role: "admin",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 📊 Monitoring

### Check Server Logs
```bash
# With npm start (shows logs in terminal)
npm start

# With nodemon (development - auto-restart)
npm run dev
```

### MongoDB Atlas Dashboard
1. Go to: https://cloud.mongodb.com
2. Login with your MongoDB account
3. Select your cluster
4. View metrics, logs, and performance

---

## 🧹 Maintenance

### Clear All Data and Re-migrate
```bash
npm run migrate
```

This is safe to run multiple times - it clears and repopulates the database.

### Backup Data

```bash
# Using mongodump
mongodump --uri="mongodb+srv://jqelpadgett_db_user:EsMrBfO7Wyth6e0I@market.gacxc2i.mongodb.net/catholicMarket" --out=backup

# Restore from backup
mongorestore --uri="mongodb+srv://jqelpadgett_db_user:EsMrBfO7Wyth6e0I@market.gacxc2i.mongodb.net/catholicMarket" backup/catholicMarket
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port is in use
netstat -ano | findstr :3200

# Kill process if needed (Windows)
taskkill /PID <process_id> /F

# Or change port in .env
PORT=3300
```

### MongoDB connection failed
```bash
# Test connection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✓ Connected')).catch(err => console.error('✗ Error:', err))"
```

### Migration fails
```bash
# Check .env file exists and has correct URI
cat .env

# Try migration with detailed logs
node migrate.js
```

---

## 📚 Useful Resources

- **Mongoose Docs:** https://mongoosejs.com/docs/
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Express Sessions:** https://www.npmjs.com/package/express-session
- **Bcrypt:** https://www.npmjs.com/package/bcryptjs

---

## 🎯 Quick Access

- **Public Site:** http://localhost:3200
- **Admin Login:** http://localhost:3200/admin
- **Admin Dashboard:** http://localhost:3200/admin/dashboard.html (after login)

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT:** Change the admin password after first login!
