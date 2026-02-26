const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('SpotlightQueue', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        businessId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        orderIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    });
};
