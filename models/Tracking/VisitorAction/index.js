const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const VisitorAction = sequelize.define(
  "VisitorAction",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actionType: {
      type: DataTypes.ENUM(
        'page_view',
        'course_click',
        'course_register_click',
        'login',
        'signup',
        'registration_submit',
        'payment_initiated',
        'payment_completed',
        'logout'
      ),
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Course ID if action is related to a course",
    },
    registrationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Registration ID if action is related to a registration",
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: "Additional data like page URL, timestamp, etc.",
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "visitor_actions",
    timestamps: true,
    indexes: [
      { fields: ["sessionId"] },
      { fields: ["userId"] },
      { fields: ["actionType"] },
      { fields: ["courseId"] },
      { fields: ["createdAt"] },
    ],
  }
);

module.exports = VisitorAction;