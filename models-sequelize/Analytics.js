// models-sequelize/Analytics.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Analytics = sequelize.define('Analytics', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'businesses',
        key: 'id'
      }
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    eventType: {
      type: DataTypes.ENUM('card_click', 'tag_click', 'directions_click', 'website_click'),
      allowNull: false
    },
    tag: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    userLocationLat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    userLocationLng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'analytics',
    timestamps: true,
    indexes: [
      { fields: ['businessId', 'timestamp'] },
      { fields: ['eventType', 'timestamp'] },
      { fields: ['timestamp'] },
      { fields: ['userLocationLat', 'userLocationLng'] }
    ]
  });

  return Analytics;
};
