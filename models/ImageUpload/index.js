const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ImageUpload = sequelize.define('ImageUpload', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true,
});

module.exports = ImageUpload;
