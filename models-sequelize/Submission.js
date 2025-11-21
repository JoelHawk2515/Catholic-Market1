// models-sequelize/Submission.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Submission = sequelize.define('Submission', {
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
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    parishId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'parishes',
        key: 'id'
      }
    },
    parishName: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'admins',
        key: 'id'
      }
    }
  }, {
    tableName: 'submissions',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['submittedAt'] }
    ]
  });

  return Submission;
};
