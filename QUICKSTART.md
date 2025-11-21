# Quick Start Guide - MongoDB Migration

## 🚀 Getting Started

Your Catholic Market application has been fully migrated to MongoDB! Here's how to get it running:

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `connect-mongo` - MongoDB session store
- `dotenv` - Environment variables

### Step 2: Verify Environment Variables

Your `.env` file has been created with your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://jqelpadgett_db_user:...@market.gacxc2i.mongodb.net/catholicMarket?retryWrites=true&w=majority
SESSION_SECRET=your-secret-key-change-this-in-production
PORT=3200
NODE_ENV=development
```

**⚠️ IMPORTANT:** Change `SESSION_SECRET` to a random string before production!

### Step 3: Run the Migration

This will populate your MongoDB database with all existing data:

```bash
npm run migrate
```

The migration will:
- ✅ Clear any existing data in MongoDB
- ✅ Migrate 8 Catholic parishes
- ✅ Migrate 23 businesses (with verified status)
- ✅ Create admin account (username: `admin`, password: `admin123`)

### Step 4: Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### Step 5: Test the Application

1. **Public Site:** Open `http://localhost:3200`
   - Search for "Wichita, KS"
   - View businesses on the map
   - Test tag filtering
   - Try submitting a new business

2. **Admin Dashboard:** Open `http://localhost:3200/admin`
   - Username: `admin`
   - Password: `admin123`
   - View pending submissions
   - Approve/reject businesses
   - Edit business details
   - Toggle verified status

---

## 📊 What Changed?

### Database Migration
- ❌ **Old:** In-memory arrays in `data.js`
- ✅ **New:** MongoDB with Mongoose ODM

### Collections Created
1. **admins** - Admin user accounts with bcrypt hashed passwords
2. **businesses** - Approved businesses (23 migrated)
3. **parishes** - Catholic parishes (8 migrated)
4. **submissions** - Pending business submissions
5. **sessions** - Express session storage

### Security Improvements
- 🔒 Passwords hashed with bcrypt (10 rounds)
- 🔒 Sessions stored in MongoDB (not memory)
- 🔒 Environment variables for sensitive data
- 🔒 HTTPS-only cookies in production

### API Changes
All API endpoints remain the same! The frontend code works without changes because the server formats MongoDB ObjectIds as regular `id` fields in responses.

---

## 🔧 Troubleshooting

### Connection Errors
If you see "MongoDB connection error":
1. Check your MongoDB Atlas cluster is running
2. Verify the connection string in `.env`
3. Ensure your IP is whitelisted in MongoDB Atlas
4. Check network access settings in MongoDB Atlas

### Migration Errors
If migration fails:
1. Check MongoDB connection
2. Verify you have write permissions
3. Try running: `npm run migrate` again

### Port Already in Use
If port 3200 is busy:
1. Change `PORT=3200` to another port in `.env`
2. Or stop the process using port 3200

---

## 📝 Next Steps

### Security Checklist
- [ ] Change admin password (login and update in MongoDB)
- [ ] Update `SESSION_SECRET` in `.env`
- [ ] Add `.env` to `.gitignore` (already done)
- [ ] Set up IP whitelist in MongoDB Atlas
- [ ] Enable HTTPS in production

### Optional Enhancements
- Add more admin accounts via MongoDB
- Implement password reset functionality
- Add email notifications for submissions
- Implement geocoding API for new submissions
- Add business image uploads

---

## 📚 Documentation

- `README.md` - Complete project documentation
- `MONGODB_SCHEMA.md` - Database schema details
- `.env.example` - Environment variable template

---

## 🎉 You're All Set!

Your application is now running on MongoDB with persistent storage. All data from `data.js` has been migrated successfully!

**Need help?** Check the console logs for detailed error messages.
