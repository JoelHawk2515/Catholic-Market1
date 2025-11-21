// convert-server-to-mysql.js
// This script reads server.js and creates server-mysql.js with all conversions

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('Converting server.js to MySQL/Sequelize...\n');

// 1. Update imports
content = content.replace(
  `const MongoStore = require('connect-mongo');`,
  `const SequelizeStore = require('connect-session-sequelize')(session.Store);`
);

content = content.replace(
  `// Import models
const Business = require("./models/Business");
const Parish = require("./models/Parish");
const Admin = require("./models/Admin");
const Submission = require("./models/Submission");
const Analytics = require("./models/Analytics");`,
  `// Import models
const { sequelize, Admin, Parish, Business, Submission, Analytics } = require('./models-sequelize');
const { Op } = require('sequelize');`
);

content = content.replace('// server.js - MongoDB version', '// server.js - MySQL version');
content = content.replace('// Connect to MongoDB', '// Connect to MySQL');

// 2. Update session store
content = content.replace(
  /store: MongoStore\.create\(\{[\s\S]*?touchAfter: 24 \* 3600.*?\n\s*\}\),/,
  `store: new SequelizeStore({
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 24 * 60 * 60 * 1000 // 24 hours
  }),`
);

// 3. Common query pattern replacements
const replacements = [
  // findById -> findByPk
  [/\.findById\(([^)]+)\)/g, '.findByPk($1)'],
  
  // find({}) -> findAll({})
  [/\.find\(\{\}\)/g, '.findAll()'],
  
  // Basic find with simple where
  [/\.find\(\{ (\w+): ([^}]+) \}\)/g, '.findAll({ where: { $1: $2 } })'],
  
  // findOne with simple where
  [/\.findOne\(\{ (\w+): ([^}]+) \}\)/g, '.findOne({ where: { $1: $2 } })'],
  
  // _id -> id (not in strings)
  [/\._id(?![\w"])/g, '.id'],
  [/\{ _id: /g, '{ id: '],
  
  // countDocuments -> count
  [/\.countDocuments\(\{\}\)/g, '.count()'],
  [/\.countDocuments\(/g, '.count({ where: '],
  
  // .lean() -> nothing (Sequelize returns plain objects by default)
  [/\.lean\(\)/g, ''],
  
  // .sort() -> order
  [/\.sort\(\{ (\w+): -1 \}\)/g, ', order: [["$1", "DESC"]]'],
  [/\.sort\(\{ (\w+): 1 \}\)/g, ', order: [["$1", "ASC"]]'],
];

replacements.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

// 4. Update Analytics userLocation references
content = content.replace(/userLocation: \{[\s\S]*?lat:[\s\S]*?lng:[\s\S]*?\}/g, (match) => {
  return match
    .replace('userLocation: {', '')
    .replace('lat:', 'userLocationLat:')
    .replace('lng:', 'userLocationLng:')
    .replace(/\s*\}$/, '');
});

content = content.replace(/userLocation\.lat/g, 'userLocationLat');
content = content.replace(/userLocation\.lng/g, 'userLocationLng');

// 5. Update special query operators
content = content.replace(/\{ \$gte: /g, '{ [Op.gte]: ');
content = content.replace(/\{ \$in: /g, '{ [Op.in]: ');
content = content.replace(/\{ \$or: /g, '{ [Op.or]: ');
content = content.replace(/\{ \$ne: /g, '{ [Op.ne]: ');
content = content.replace(/\$exists: true/g, '[Op.ne]: null');
content = content.replace(/\$exists: false/g, '[Op.eq]: null');

// Write to new file
const outputPath = path.join(__dirname, 'server-mysql.js');
fs.writeFileSync(outputPath, content, 'utf8');

console.log('✓ Created server-mysql.js');
console.log('\nNote: This is an automated conversion. You may need to manually fix:');
console.log('- Complex query patterns');
console.log('- Aggregate queries');
console.log('- Transaction handling');
console.log('- References to mongoose-specific methods\n');
