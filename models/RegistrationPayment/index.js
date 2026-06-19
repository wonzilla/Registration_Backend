const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const RegistrationPayment = sequelize.define(
  "RegistrationPayment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    registrationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Reference to Registration",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM("cash", "bank_transfer", "easypaisa", "jazzcash"),
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentScreenshotId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Media ID for payment screenshot",
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    isDiscounted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Whether discounted fee was applied",
    },
    originalFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discountedFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "review",  "completed", "failed"),
      defaultValue: "pending",
    },
    adminRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "registration_payments",
    timestamps: true,
    indexes: [
      { fields: ["registrationId"] },
      { fields: ["status"] },
      { fields: ["transactionId"] },
    ],
  }
);

module.exports = RegistrationPayment;