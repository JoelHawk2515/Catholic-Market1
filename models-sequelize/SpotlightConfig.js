const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('SpotlightConfig', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        dayOfWeek: {
            type: DataTypes.INTEGER, // 0 = Sunday, 1 = Monday, etc.
            allowNull: false,
            defaultValue: 1 // Monday
        },
        timeOfDay: {
            type: DataTypes.STRING, // "HH:MM" in 24-hour mode
            allowNull: false,
            defaultValue: '12:00'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });
};
