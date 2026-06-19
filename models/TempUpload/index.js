// src/models/TempUpload.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const TempUpload = sequelize.define('TempUpload', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    autoIncrement: false
  },
  fileId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Cloudinary public_id'
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  uploadType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'teacher-register-docs, student-payment, etc'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'TempUploads',
  timestamps: true,
  indexes: [
    { fields: ['expiresAt', 'isUsed'] },
    { fields: ['uploadType'] },
    { fields: ['isUsed'] }
  ]
});

module.exports = TempUpload;