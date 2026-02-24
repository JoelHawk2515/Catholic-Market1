// models-sequelize/PushSubscription.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PushSubscription = sequelize.define('PushSubscription', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        endpoint: {
            type: DataTypes.STRING(500),
            allowNull: false,
            unique: true
        },
        p256dh: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        auth: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'push_subscriptions',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['endpoint'] }
        ]
    });

    return PushSubscription;
};
