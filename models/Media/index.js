// models/Media/index.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Media = sequelize.define('Media', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    public_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    type: {
        type: DataTypes.ENUM('image', 'video', 'file'),
        defaultValue: 'image'
    },
    folder: {
        type: DataTypes.STRING,
        allowNull: true
    },
    moduleType: {
        type: DataTypes.ENUM('course', 'registration_payment', 'payment'),
        allowNull: false
    },
    moduleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'media',
    indexes: [
        { fields: ['moduleType'] },
        { fields: ['moduleId'] },
        { fields: ['moduleType', 'moduleId'] }
    ]
});

module.exports = Media;