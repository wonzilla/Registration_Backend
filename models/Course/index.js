const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
   slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  category: {
    type: DataTypes.ENUM('ecommerce', 'development', 'design', 'marketing', 'office'),
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '📚',
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

      discountedPercentage: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

    discountedFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  prerequisites: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  outline: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  schedule: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['category'],
    },
    {
      fields: ['isActive'],
    },
    {
      fields: ['name'],
    },
    {
      unique: true,
      fields: ['slug'],
    }
  ],
});

module.exports = Course;