const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Visitor = sequelize.define(
  "Visitor",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "User ID if logged in",
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.ENUM('desktop', 'tablet', 'mobile', 'unknown'),
      defaultValue: 'unknown',
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    os: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    landingPage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isLoggedIn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    firstVisit: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    visitCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    totalTimeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Total time spent in seconds",
    },
  },
  {
    tableName: "visitors",
    timestamps: true,
    indexes: [
      { fields: ["sessionId"] },
      { fields: ["userId"] },
      { fields: ["isLoggedIn"] },
      { fields: ["createdAt"] },
    ],
  }
);

module.exports = Visitor;