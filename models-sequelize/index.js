// models-sequelize/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Disable query logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 10000 // 10 seconds
    }
  }
);

console.log('MySQL Configuration:');
console.log('  Host:', process.env.MYSQL_HOST);
console.log('  Port:', process.env.MYSQL_PORT || 3306);
console.log('  Database:', process.env.MYSQL_DATABASE);
console.log('  User:', process.env.MYSQL_USER);
console.log('  Password:', process.env.MYSQL_PASSWORD ? '***' + process.env.MYSQL_PASSWORD.slice(-3) : 'NOT SET');
console.log();

// Import models
const Admin = require('./Admin')(sequelize);
const Parish = require('./Parish')(sequelize);
const Business = require('./Business')(sequelize);
const Submission = require('./Submission')(sequelize);
const Analytics = require('./Analytics')(sequelize);
const PushSubscription = require('./PushSubscription')(sequelize);

// Define relationships
Business.belongsTo(Parish, { foreignKey: 'parishId', as: 'parish' });
Parish.hasMany(Business, { foreignKey: 'parishId', as: 'businesses' });

Submission.belongsTo(Parish, { foreignKey: 'parishId', as: 'parish' });
Submission.belongsTo(Admin, { foreignKey: 'reviewedBy', as: 'reviewer' });

Analytics.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });
Business.hasMany(Analytics, { foreignKey: 'businessId', as: 'analytics' });

module.exports = {
  sequelize,
  Admin,
  Parish,
  Business,
  Submission,
  Analytics,
  PushSubscription
};
