// server-mysql-conversion-guide.md
# Complete list of changes needed in server.js for MySQL/Sequelize

## 1. Import changes (lines 1-17)
- Replace: const MongoStore = require('connect-mongo');
- With: const SequelizeStore = require('connect-session-sequelize')(session.Store);

- Replace: const Business = require("./models/Business");
           const Parish = require("./models/Parish");
           const Admin = require("./models/Admin");
           const Submission = require("./models/Submission");
           const Analytics = require("./models/Analytics");
- With: const { sequelize, Admin, Parish, Business, Submission, Analytics } = require('./models-sequelize');

## 2. Session store (lines 76-84)
- Replace MongoStore with SequelizeStore
- Use: store: new SequelizeStore({ db: sequelize })

## 3. Query conversions throughout file:
- Model.findById(id) → Model.findByPk(id)
- Model.find({}) → Model.findAll({})
- Model.find({ field: value }) → Model.findAll({ where: { field: value } })
- Model.findOne({ field: value }) → Model.findOne({ where: { field: value } })
- model.save() → model.save() (same)
- new Model({...}) → Model.create({...}) OR new Model({...}); await model.save()
- Model.countDocuments({}) → Model.count({})
- Model.countDocuments({ where }) → Model.count({ where: {...} })
- model._id → model.id
- model._id.toString() → model.id.toString()
- { $gte: value } → { [Op.gte]: value }
- { $in: [...] } → { [Op.in]: [...] }
- { $or: [...] } → { [Op.or]: [...] }
- .lean() → .raw: true in options
- .sort({ field: -1 }) → order: [['field', 'DESC']]

## 4. Analytics userLocation field:
- MongoDB stores as: { lat: number, lng: number }
- MySQL stores as: userLocationLat, userLocationLng (separate fields)
- Update all references

## 5. ObjectId references:
- Replace mongoose ObjectId checks with integer ID checks
- parishId: mongoose.Schema.Types.ObjectId → parishId: INTEGER

## 6. Tags field in Business:
- MongoDB: Array of strings
- MySQL: JSON field
- Access is the same but ensure JSON serialization

This file is for reference only - actual conversion will be done programmatically.
