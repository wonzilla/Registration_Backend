require("dotenv");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken")
const { sendResponse } = require("../../helper/responseHelper");





const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD



    router.post("/login", async (req, res) => {
        console.log("request coming on login")
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "MISSING_CREDENTIALS",
        message: "Email and password are required"
      });
    }

    // Check credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return sendResponse(req, res, {
        statusCode: 401,
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: 1,
        email: ADMIN_EMAIL,
        name: "Farhan",
        role: "admin",
        isAdmin: true
      },
      process.env.JWT_SECRET || "your-secret-key-change-this",
      { expiresIn: "7d" }
    );

    // Set cookie with token
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response with user data and token
    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "LOGIN_SUCCESS",
      message: "Login successful",
      data: {
        token,
        user: {
          id: 1,
          name: "Farhan",
          email: ADMIN_EMAIL,
          role: "admin"
        }
      }
    });

  } catch (error) {
    console.error("Admin Login Error:", error);
    return sendResponse(req, res, {
      statusCode: 500,
      success: false,
      code: "LOGIN_ERROR",
      message: "Login failed. Please try again."
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie("adminToken");
    
    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "LOGOUT_SUCCESS",
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Admin Logout Error:", error);
    return sendResponse(req, res, {
      statusCode: 500,
      success: false,
      code: "LOGOUT_ERROR",
      message: "Logout failed"
    });
  }
});


module.exports = router
