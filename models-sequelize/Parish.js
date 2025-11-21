// models-sequelize/Parish.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Parish = sequelize.define('Parish', {
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
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    zip: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'parishes',
    timestamps: true,
    indexes: [
      { fields: ['lat', 'lng'] },
      { fields: ['city'] }
    ]
  });

  return Parish;
};
