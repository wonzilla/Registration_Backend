const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const sequelize = require('../../config/database');
const sendOTPEmail = require('../../helper/otpHelper');
const { Op } = require('sequelize');
const fs = require('fs');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');

class UserService {
  constructor(models) {
    this.models = models;
    this.User = models.User;
    this.ImageUpload = models.ImageUpload;
    this.otpStore = new Map();
  }

  async uploadImages(files) {
    const imagesArr = [];
    
    for (let i = 0; i < files?.length; i++) {
      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      };

      const result = await cloudinary.uploader.upload(files[i].path, options);
      imagesArr.push(result.secure_url);
      fs.unlinkSync(`uploads/${files[i].filename}`);
    }

    await this.ImageUpload.create({
      images: JSON.stringify(imagesArr)
    });

    return imagesArr;
  }

  async createUser(userData) {
    // Validate phone if provided
    if (userData.phone && typeof userData.phone === 'string') {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(userData.phone)) {
        throw new Error('Phone number must be between 10 to 15 digits and contain only numbers.');
      }
    }

    // Check existing user
    const existingUser = await this.User.findOne({ where: { email: userData.email } });
    const existingUserByPhone = await this.User.findOne({ where: { phone: userData.phone } });

    if (existingUser) {
      if (existingUser.auth_provider === 'local') {
        throw new Error('User already exists with this email. Please sign in using email and password.');
      }
      if (existingUser.auth_provider === 'google') {
        throw new Error('This email is already registered via Google. Please sign in using Google.');
      }
    }

    if (existingUserByPhone) {
      throw new Error('User already exists with this phone number!');
    }

    const result = await this.User.create({
      name: userData.name,
      phone: userData.phone || null,
      email: userData.email,
      password: userData.password,
      isAdmin: userData.isAdmin || false,
      country: userData.country || "",
      locality: userData.locality || "",
      houseNumber: userData.houseNumber || "",
      city: userData.city || "",
      state: userData.state || "",
      zipCode: userData.zipCode || "",
      images: userData.images || [],
      auth_provider: 'local',
    });

    const token = jwt.sign(
      { email: result.email, id: result.id },
      process.env.JWT_SECRET || process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    return { user: result, token };
  }

 async authenticateUser(email, password) {
    const user = await this.User.findOne({ where: { email } });

    if (!user) {
      throw new Error('User not found!');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error(`Account is locked. Please try again later. Unlocked at ${user.lockedUntil}`);
    }

    if (user.auth_provider === 'google' && !user.password) {
      throw new Error('This email is registered via Google. Please sign in using Google.');
    }

    const matchPassword = await user.comparePassword(password);
    if (!matchPassword) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();
        throw new Error('Account locked due to multiple failed attempts. Try again in 30 minutes');
      }
      
      await user.save();
      throw new Error('Email or Password is Incorrect');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate OTP for 2FA
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpSentAt = new Date();
    await user.save();

    const mailOptions = {
      subject: '🔐 Your Login OTP - SM Academy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Verification</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #f6f9fc;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .container {
              max-width: 560px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 24px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
              overflow: hidden;
              border: 1px solid rgba(0, 0, 0, 0.04);
            }
            .header {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
              padding: 40px 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -20%;
              width: 60%;
              height: 100%;
              background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
              border-radius: 50%;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -30%;
              left: -10%;
              width: 40%;
              height: 80%;
              background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
              border-radius: 50%;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              color: #ffffff;
              letter-spacing: -0.5px;
              position: relative;
              z-index: 1;
            }
            .logo span {
              background: linear-gradient(135deg, #667eea, #764ba2);
              padding: 2px 12px;
              border-radius: 8px;
              margin-left: 4px;
            }
            .logo-sub {
              font-size: 12px;
              color: rgba(255,255,255,0.6);
              font-weight: 400;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-top: 4px;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 40px 40px 30px;
            }
            .greeting {
              font-size: 22px;
              font-weight: 700;
              color: #1a1a2e;
              margin-bottom: 8px;
            }
            .sub-greeting {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .otp-container {
              background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
              border-radius: 16px;
              padding: 28px 20px;
              text-align: center;
              border: 2px dashed rgba(102, 126, 234, 0.2);
              margin-bottom: 28px;
              position: relative;
            }
            .otp-label {
              font-size: 13px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 12px;
              display: block;
            }
            .otp-code {
              font-size: 48px;
              font-weight: 800;
              color: #1a1a2e;
              letter-spacing: 12px;
              font-family: 'Inter', 'Courier New', monospace;
              background: white;
              padding: 12px 24px;
              border-radius: 12px;
              display: inline-block;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.08);
              border: 1px solid rgba(102, 126, 234, 0.1);
            }
            .otp-expiry {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              margin-top: 14px;
              font-size: 13px;
              color: #6b7280;
              background: rgba(239, 68, 68, 0.06);
              padding: 6px 16px;
              border-radius: 20px;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
              margin: 24px 0;
            }
            .footer-text {
              text-align: center;
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.8;
            }
            .footer-text strong {
              color: #6b7280;
            }
            .footer {
              background: #f8fafc;
              padding: 20px 40px;
              text-align: center;
              border-top: 1px solid rgba(0,0,0,0.04);
            }
            .footer p {
              font-size: 12px;
              color: #9ca3af;
              line-height: 1.8;
            }
            .footer .brand {
              color: #667eea;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              .container { margin: 16px; border-radius: 16px; }
              .header { padding: 30px 24px 24px; }
              .content { padding: 28px 24px 20px; }
              .otp-code { font-size: 36px; letter-spacing: 8px; padding: 10px 16px; }
              .greeting { font-size: 18px; }
              .footer { padding: 16px 24px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SM <span>Academy</span></div>
              <div class="logo-sub">Secure · Trusted · Excellence</div>
            </div>
            <div class="content">
              <div class="greeting">🔐 Verification Required</div>
              <div class="sub-greeting">Enter the OTP below to complete your login. This code will expire in 5 minutes.</div>
              <div class="otp-container">
                <span class="otp-label">✦ One-Time Password ✦</span>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">
                  <span>⏱️</span>
                  <span>Expires in <strong>5 minutes</strong></span>
                </div>
              </div>
              <div class="divider"></div>
              <div class="footer-text">
                <strong>Didn't request this?</strong> You can safely ignore this email.<br>
                For security, never share your OTP with anyone.
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — Empowering learning, one student at a time.</p>
              <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendOTPEmail(user.email, mailOptions);

    return { msg: "OTP sent to your email", email: user.email };
  }




  async googleAuth(userData) {
    const { name, phone, email, images, isAdmin } = userData;
    
    const existingUser = await this.User.findOne({ where: { email } });

    if (!existingUser) {
      const newUser = await this.User.create({
        name,
        phone: phone || null,
        email,
        images: images || [],
        isAdmin: isAdmin || false,
        country: "",
        locality: "",
        houseNumber: "",
        city: "",
        state: "",
        zipCode: "",
        auth_provider: "google",
      });

       const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

      return { user: newUser, accessToken, refreshToken,  msg: "User registered and logged in with Google successfully!" };
    }

    if (existingUser.auth_provider === 'local') {
      throw new Error('This email is already registered. Please sign in using your email and password.');
    }

   const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    return { user: existingUser, accessToken, refreshToken, msg: "User logged in with Google successfully!" };
  }


  // In UserService
async adminLogin(email, password) {
  // Only allow specific admin email
  if (email !== 'tahqeeq86@gmail.com') {
    throw new Error('Unauthorized access');
  }

  const user = await this.User.findOne({ where: { email } });
  
  if (!user) {
    throw new Error('Admin user not found');
  }

  const matchPassword = await user.comparePassword(password);
  if (!matchPassword) {
    throw new Error('Invalid admin credentials');
  }

  // Set admin flag
  if (!user.isAdmin) {
    user.isAdmin = true;
    await user.save();
  }

  const token = jwt.sign(
    { 
      email: user.email, 
      id: user.id,
      role: 'admin' 
    },
    process.env.JWT_SECRET || process.env.JSON_WEB_TOKEN_SECRET_KEY,
    { expiresIn: '7d' }
  );

  return { 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      images: user.images,
      role: 'admin',
      isAdmin: true
    }, 
    token, 
    msg: "Admin login successful" 
  };
}
// In UserService
async adminLogin(email, password) {
  // Only allow specific admin email
  if (email !== 'tahqeeq86@gmail.com') {
    throw new Error('Unauthorized access');
  }

  const user = await this.User.findOne({ where: { email } });
  
  if (!user) {
    throw new Error('Admin user not found');
  }

  const matchPassword = await user.comparePassword(password);
  if (!matchPassword) {
    throw new Error('Invalid admin credentials');
  }

  // Set admin flag
  if (!user.isAdmin) {
    user.isAdmin = true;
    await user.save();
  }

  const token = jwt.sign(
    { 
      email: user.email, 
      id: user.id,
      role: 'admin' 
    },
    process.env.JWT_SECRET || process.env.JSON_WEB_TOKEN_SECRET_KEY,
    { expiresIn: '7d' }
  );

    
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
user.refreshToken = refreshToken;
 user.lastLoginAt = new Date();
  await user.save();
 return { 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'admin',
      isAdmin: true
    }, 
    token: accessToken,
    refreshToken: refreshToken,
    msg: "Admin login successful" 
  };
}





  async resendOTP(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const ONE_MINUTE = 1 * 60 * 1000;
    if (user.otpSentAt && Date.now() - new Date(user.otpSentAt).getTime() < ONE_MINUTE) {
      throw new Error('Please wait at least 1 minute before resending OTP.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpSentAt = new Date();
    await user.save();

const mailOptions = {
  subject: '🔄 New OTP - SM Academy',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New OTP</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f6f9fc;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .container {
          max-width: 560px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 40px 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 60%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          border-radius: 50%;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 40%;
          height: 80%;
          background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
          border-radius: 50%;
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
        }
        .logo span {
          background: linear-gradient(135deg, #667eea, #764ba2);
          padding: 2px 12px;
          border-radius: 8px;
          margin-left: 4px;
        }
        .logo-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 4px;
          position: relative;
          z-index: 1;
        }
        .content {
          padding: 40px 40px 30px;
        }
        .greeting {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .sub-greeting {
          color: #6b7280;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .otp-container {
          background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
          border: 2px dashed rgba(102, 126, 234, 0.2);
          margin-bottom: 28px;
          position: relative;
        }
        .otp-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          display: block;
        }
        .resend-badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 16px;
          border-radius: 20px;
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .otp-code {
          font-size: 48px;
          font-weight: 800;
          color: #1a1a2e;
          letter-spacing: 12px;
          font-family: 'Inter', 'Courier New', monospace;
          background: white;
          padding: 12px 24px;
          border-radius: 12px;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .otp-expiry {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          font-size: 13px;
          color: #6b7280;
          background: rgba(239, 68, 68, 0.06);
          padding: 6px 16px;
          border-radius: 20px;
        }
        .otp-expiry svg {
          width: 16px;
          height: 16px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
          margin: 24px 0;
        }
        .footer-text {
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
          line-height: 1.8;
        }
        .footer-text strong {
          color: #6b7280;
        }
        .footer {
          background: #f8fafc;
          padding: 20px 40px;
          text-align: center;
          border-top: 1px solid rgba(0,0,0,0.04);
        }
        .footer p {
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.8;
        }
        .footer .brand {
          color: #667eea;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .container {
            margin: 16px;
            border-radius: 16px;
          }
          .header {
            padding: 30px 24px 24px;
          }
          .content {
            padding: 28px 24px 20px;
          }
          .otp-code {
            font-size: 36px;
            letter-spacing: 8px;
            padding: 10px 16px;
          }
          .greeting {
            font-size: 18px;
          }
          .footer {
            padding: 16px 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            SM <span>Academy</span>
          </div>
          <div class="logo-sub">Secure · Trusted · Excellence</div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="greeting">
            🔄 New Verification Code
          </div>
          <div class="sub-greeting">
            We've sent a new OTP to your email. Enter the code below to complete your login. This code will expire in 5 minutes.
          </div>
          
          <!-- OTP Section -->
          <div class="otp-container">
            <span class="resend-badge">✦ NEW CODE ✦</span>
            <span class="otp-label">✦ One-Time Password ✦</span>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">
              <span>⏱️</span>
              <span>Expires in <strong>5 minutes</strong></span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer-text">
            <strong>Didn't request this?</strong> You can safely ignore this email.<br>
            For security, never share your OTP with anyone.
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>
            &copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — 
            Empowering learning, one student at a time.
          </p>
          <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
};

    await sendOTPEmail(user.email, mailOptions);

    return { msg: "OTP resent successfully", email: user.email };
  }

  async verifyOTP(email, otp) {
    const user = await this.User.findOne({ where: { email } });

    if (!user || user.otp !== otp) {
      // Increment OTP attempts
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        throw new Error('Too many failed OTP attempts. Account locked for 30 minutes.');
      }
      await user.save();
      throw new Error('Invalid OTP');
    }

    if (Date.now() > user.otpExpires) {
      throw new Error('OTP expired');
    }

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpires = null;
    user.otpSentAt = null;
    user.otpAttempts = 0;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return { 
      user, 
      accessToken, 
      refreshToken, 
      msg: "OTP Verified. User Authenticated." 
    };
  }

  async updateUser(userId, updateData) {
    const userExist = await this.User.findByPk(userId);
    if (!userExist) {
      throw new Error('User not found!');
    }

    const updateFields = {};
    
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
    if (updateData.country !== undefined) updateFields.country = updateData.country;
    if (updateData.city !== undefined) updateFields.city = updateData.city;
    if (updateData.state !== undefined) updateFields.state = updateData.state;
    if (updateData.zipCode !== undefined) updateFields.zipCode = updateData.zipCode;
    if (updateData.locality !== undefined) updateFields.locality = updateData.locality;
    if (updateData.houseNumber !== undefined) updateFields.houseNumber = updateData.houseNumber;
    if (updateData.images !== undefined) updateFields.images = updateData.images;
    
    if (updateData.email && updateData.email !== userExist.email) {
      const existingUser = await this.User.findOne({ where: { email: updateData.email } });
      if (existingUser) {
        throw new Error('Email already in use');
      }
      updateFields.email = updateData.email;
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(updateData.password, salt);
    }

    await this.User.update(updateFields, { where: { id: userId } });

    const updatedUser = await this.User.findByPk(userId, {
      attributes: { exclude: ['password', 'otp', 'otpExpires', 'otpSentAt'] }
    });
    return { success: true, msg: "User Profile Updated Successfully", user: updatedUser };
  }

  async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new Error('Both old and new passwords are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const user = await this.User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.password) {
      throw new Error('User has no password set. Please use Google sign-in.');
    }

    const matchPassword = await user.comparePassword(oldPassword);
    if (!matchPassword) {
      throw new Error('Old password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return { msg: "Password changed successfully" };
  }

  async getUserById(userId) {
    const user = await this.User.findByPk(userId, {
      attributes: { exclude: ['password', 'otp', 'otpExpires', 'otpSentAt'] }
    });
    if (!user) {
      throw new Error('User not found!');
    }
    return user;
  }

  async getAllUsers() {
    return await this.User.findAll({
      attributes: { exclude: ['password', 'otp', 'otpExpires', 'otpSentAt'] }
    });
  }

  async deleteUser(userId) {
    const transaction = await sequelize.transaction();

    try {
      const user = await this.User.findByPk(userId, { transaction });
      if (!user) {
        throw new Error('User not found!');
      }

      await this.User.destroy({ where: { id: userId }, transaction });
      await transaction.commit();

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getUserCount() {
    return await this.User.count();
  }

  async deleteCloudinaryImage(imgUrl) {
    const urlArr = imgUrl.split('/');
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split('.')[0];

    const response = await cloudinary.uploader.destroy(imageName);
    return response;
  }

  async requestPasswordReset(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.otpStore.set(email, { otp, expiresAt });

    const mailOptions = {
      subject: 'Reset Your Password',
      html: `<h3>Your Password Reset OTP is: ${otp}</h3><p>This OTP will expire in 5 minutes.</p><p>If you didn't request this, please ignore this email.</p>`
    };

    await sendOTPEmail(email, mailOptions);

    return { msg: "OTP sent to your email.", email };
  }

  verifyResetOTP(email, otp) {
    const record = this.otpStore.get(email);

    if (!record) {
      throw new Error('OTP expired or not found. Please request a new OTP.');
    }

    const { otp: storedOtp, expiresAt } = record;

    if (Date.now() > expiresAt) {
      this.otpStore.delete(email);
      throw new Error('OTP expired. Please request a new OTP.');
    }

    if (otp !== storedOtp) {
      throw new Error('Invalid OTP');
    }

    return { msg: "OTP verified successfully" };
  }

  async updatePasswordWithReset(email, newPassword, otp) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const record = this.otpStore.get(email);
    if (!record) {
      throw new Error('OTP expired or not found. Please request a new OTP.');
    }

    const { otp: storedOtp, expiresAt } = record;

    if (Date.now() > expiresAt) {
      this.otpStore.delete(email);
      throw new Error('OTP expired. Please request a new OTP.');
    }

    if (otp !== storedOtp) {
      throw new Error('Invalid OTP');
    }

    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    this.otpStore.delete(email);

    return { msg: "Password reset successfully. You can now login with your new password." };
  }

  async checkCredentialsForEmailChange(email, password) {
    const user = await this.User.findOne({ where: { email } });

    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 300000; // 5 minutes
    user.otpSentAt = new Date();
    await user.save();

    await sendOTPEmail(email, {
      subject: 'Email Change Verification',
      html: `<h3>Your OTP for email change is: ${otp}</h3><p>This OTP will expire in 5 minutes.</p>`
    });

    return { msg: "OTP Sent Successfully To Your Email" };
  }

  async verifyOTPForEmailChange(email, otp) {
    const user = await this.User.findOne({
      where: {
        email,
        otp,
        otpExpires: {
          [Op.gt]: Date.now()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired OTP');
    }

    return { msg: "Your OTP is Verified. Enter Your New Email" };
  }

  async sendNewEmailOTP(currentEmail, newEmail) {
    const user = await this.User.findOne({ where: { email: currentEmail } });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if OTP was verified for email change
    if (!user.otp || user.otpExpires < Date.now()) {
      throw new Error('Please verify your identity first');
    }

    const existingUser = await this.User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      throw new Error('New email already in use');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the new email temporarily
    user.tempNewEmail = newEmail;
    user.emailChangeOtp = otp;
    user.emailChangeOtpExpires = Date.now() + 300000;
    await user.save();

    await sendOTPEmail(newEmail, {
      subject: 'Confirm Your New Email Address',
      html: `<h3>Your OTP to confirm new email is: ${otp}</h3><p>This OTP will expire in 5 minutes.</p>`
    });

    return { msg: "OTP Sent To Your New Email Address" };
  }

  async updateEmail(currentEmail, otp, newEmail) {
    const user = await this.User.findOne({
      where: {
        email: currentEmail,
        emailChangeOtp: otp,
        emailChangeOtpExpires: {
          [Op.gt]: Date.now()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired OTP for email change');
    }

    // Update email
    user.email = newEmail;
    user.otp = null;
    user.otpExpires = null;
    user.otpSentAt = null;
    user.tempNewEmail = null;
    user.emailChangeOtp = null;
    user.emailChangeOtpExpires = null;
    await user.save();

    return { msg: "Email Updated Successfully" };
  }
}

module.exports = UserService;