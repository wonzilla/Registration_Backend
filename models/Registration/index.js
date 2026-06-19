const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Registration = sequelize.define(
  "Registration",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
      userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "User Who Registered",
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Student Registration Course",
    },
    courseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    courseCategory: {
      type: DataTypes.ENUM("ecommerce", "development", "design", "marketing", "office", "other"),
      defaultValue: "other",
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      defaultValue: "Chiniot",
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    previousExperience: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "review" ,  "completed"),
      defaultValue: "pending",
    },
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

        isReApplied: {
      type: DataTypes.BOOLEAN,
      allowNull:true,
      defaultValue: false ,
    },

        reApplyCountNumber: {
      type: DataTypes.INTEGER,
      allowNull:true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "3 days after approval for discounted fee",
    },
    originalFeeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Original course fee from Course model",
    },
    discountedFeeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Discounted course fee from Course model",
    },
  },
  {
    tableName: "registrations",
    timestamps: true,
    indexes: [
      { fields: ["courseName"] },
      { fields: ["email"] },
      { fields: ["whatsappNumber"] },
      { fields: ["status"] },
      { fields: ["registrationNumber"] },
    ],
  }
);

module.exports = Registration;