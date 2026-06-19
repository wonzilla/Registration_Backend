const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null, 
    },
    auth_provider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "users_email_unique",
        msg: "Email address must be unique",
      },
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    locality: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    houseNumber: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    city: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    state: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    zipCode: {
      type: DataTypes.STRING,
      defaultValue: "",
    },

    // ============ AUTHENTICATION FIELDS ============
    
    // OTP related
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otpSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otpAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Number of failed OTP attempts",
    },

    // Login attempts & account locking
    loginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Number of failed login attempts",
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Account locked until this date/time",
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last successful login timestamp",
    },
    lastLoginIP: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "IP address of last login",
    },

    // Refresh tokens
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Current refresh token",
    },
    refreshTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Refresh token expiry date",
    },

    // Account status
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: true,
      defaultValue: "active",
    },
    suspendedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When account was suspended",
    },
    suspensionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reason for suspension",
    },

    // Online status
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last activity timestamp",
    },
  },
  {
    timestamps: true, 
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["refreshToken"],
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password") && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
User.prototype.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// Instance method to check if account is active
User.prototype.isActive = function () {
  return this.status === 'active';
};

// Instance method to check if account is suspended
User.prototype.isSuspended = function () {
  return this.status === 'suspended';
};

// Instance method to increment login attempts
User.prototype.incrementLoginAttempts = async function () {
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  if (this.loginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  }
  await this.save();
  return this;
};

// Instance method to reset login attempts
User.prototype.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockedUntil = null;
  await this.save();
  return this;
};

// Instance method to update last login
User.prototype.updateLastLogin = async function (ip = null) {
  this.lastLoginAt = new Date();
  if (ip) this.lastLoginIP = ip;
  this.isOnline = true;
  await this.save();
  return this;
};

// Instance method to set refresh token
User.prototype.setRefreshToken = async function (token, expiresIn = '7d') {
  this.refreshToken = token;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days
  this.refreshTokenExpires = expiryDate;
  await this.save();
  return this;
};

// Instance method to clear refresh token
User.prototype.clearRefreshToken = async function () {
  this.refreshToken = null;
  this.refreshTokenExpires = null;
  await this.save();
  return this;
};

// Instance method to suspend account
User.prototype.suspend = async function (reason = null) {
  this.status = 'suspended';
  this.suspendedAt = new Date();
  if (reason) this.suspensionReason = reason;
  await this.save();
  return this;
};

// Instance method to activate account
User.prototype.activate = async function () {
  this.status = 'active';
  this.suspendedAt = null;
  this.suspensionReason = null;
  this.loginAttempts = 0;
  this.lockedUntil = null;
  await this.save();
  return this;
};

module.exports = User;