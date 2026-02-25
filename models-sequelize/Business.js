// models-sequelize/Business.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Business = sequelize.define('Business', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    zip: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(13, 10),
      allowNull: true
    },
    lng: {
      type: DataTypes.DECIMAL(14, 10),
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    parishId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'parishes',
        key: 'id'
      }
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sponsored: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    hasWifi: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    familyFriendly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasParking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Schedule fields - stored as JSON with day-specific hours
    schedule: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'businesses',
    timestamps: true,
    indexes: [
      { fields: ['lat', 'lng'] },
      { fields: ['verified'] },
      { fields: ['sponsored'] }
    ]
  });

  return Business;
};
