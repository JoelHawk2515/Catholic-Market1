# Catholic Market

A modern directory for Catholic businesses with interactive maps and parish affiliations.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env` if needed
   - The `.env` file should already contain your MongoDB connection string

3. Run the migration to populate MongoDB with initial data:
```bash
npm run migrate
```

This will:
- Clear existing data in MongoDB
- Migrate 23 businesses from data.js
- Migrate 8 Catholic parishes
- Create an admin account (username: `admin`, password: `admin123`)

4. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

5. Open your browser to `http://localhost:3200`

### Admin Access

- Login at: `http://localhost:3200/admin`
- Username: `admin`
- Password: `admin123`

**Important:** Change the admin password after first login!

## Features

- 🗺️ Interactive map with business locations
- ⛪ Catholic parish markers and affiliations
- 🏷️ Tag-based filtering system
- ✅ Business verification system
- 👤 Admin dashboard for managing submissions
- 🔒 Secure session-based authentication
- 💾 MongoDB database with persistent storage

## Project Structure

```
/models          - Mongoose schemas (Business, Parish, Admin, Submission)
/public          - Frontend files (HTML, CSS, JS)
  /admin         - Admin dashboard files
  /img           - Images
/db.js           - MongoDB connection
/server.js       - Express server with MongoDB
/migrate.js      - Data migration script
/.env            - Environment variables (not in git)
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret key for sessions
- `PORT` - Server port (default: 3200)
- `NODE_ENV` - Environment (development/production)

## Security Notes

- Session data is stored in MongoDB using `connect-mongo`
- Admin passwords are hashed with bcrypt
- HTTPS cookies in production
- Protected admin routes with authentication middleware

## Development

To reset the database and re-migrate:
```bash
npm run migrate
```

This will clear all data and re-populate from data.js.
