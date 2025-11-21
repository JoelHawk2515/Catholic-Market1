# MySQL Migration Guide for Catholic Market

## Step 1: Update your .env file

Add these MySQL credentials to your `.env` file:

```
MYSQL_HOST=104-129-131-25.cloud-xip.com
MYSQL_PORT=3306
MYSQL_USER=<YOUR_USERNAME_HERE>
MYSQL_PASSWORD=<YOUR_PASSWORD_HERE>
MYSQL_DATABASE=catholicMarket
```

**IMPORTANT**: Replace `<YOUR_USERNAME_HERE>` and `<YOUR_PASSWORD_HERE>` with the actual MySQL credentials.

## Step 2: Install new dependencies

Run this command:
```powershell
npm install mysql2 sequelize connect-session-sequelize
```

## Step 3: Migrate your data from MongoDB to MySQL

Once you have the MySQL credentials set up, run:
```powershell
node migrate-mongodb-to-mysql.js
```

This will:
- Connect to both MongoDB and MySQL
- Create all tables in MySQL
- Copy all data from MongoDB to MySQL
- Map MongoDB ObjectIDs to MySQL integer IDs
- Preserve all relationships

## Step 4: Update server.js

I'll create a new `server-mysql.js` file with all the necessary conversions. You can then:
- Test it first: `node server-mysql.js`
- If it works, backup your old server.js and rename server-mysql.js to server.js

## What's been created:

1. **models-sequelize/** - New folder with all MySQL models
   - Admin.js
   - Business.js
   - Parish.js
   - Submission.js
   - Analytics.js
   - index.js (connects everything)

2. **db.js** - Updated to use Sequelize/MySQL

3. **package.json** - Added mysql2, sequelize, connect-session-sequelize

4. **migrate-mongodb-to-mysql.js** - Data migration script

5. **.env.mysql.template** - Template showing what credentials you need

## Key differences:

- MongoDB ObjectId → MySQL INTEGER (auto-increment)
- MongoDB nested objects → MySQL separate fields (e.g., userLocation.lat → userLocationLat)
- MongoDB arrays → MySQL JSON fields
- findById() → findByPk()
- find() → findAll()
- countDocuments() → count()
- $gte, $in operators → Sequelize Op.gte, Op.in

## After migration:

You can keep MongoDB as backup or remove it from package.json once you confirm MySQL works properly.
