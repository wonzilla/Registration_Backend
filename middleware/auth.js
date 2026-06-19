const jwt = require("jsonwebtoken");

class AuthMiddleware {
  constructor(models) {
    this.models = models;
    this.User = models.User;
  }

  /**
   * Simple authentication middleware
   * Just validates token and attaches user to request
   */
authenticate = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken;

    let decoded = null;
    let isRefreshTokenUsed = false;

    // If no access token, try refresh token
    if (!token) {
      const refreshToken = req.cookies?.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ 
          success: false, 
          msg: "Authentication required. Please login." 
        });
      }

      try {
        // Verify refresh token
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JSON_WEB_TOKEN_REFRESH_KEY);
        isRefreshTokenUsed = true;
        console.log("🔄 Refresh token used to generate new access token");
      } catch (err) {
        // Clear invalid tokens
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(401).json({ 
          success: false, 
          msg: "Invalid or expired refresh token. Please login again." 
        });
      }
    } else {
      // Verify access token
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JSON_WEB_TOKEN_SECRET_KEY);
      } catch (err) {
        // If access token expired, try refresh token
        if (err.name === 'TokenExpiredError') {
          const refreshToken = req.cookies?.refreshToken;
          
          if (!refreshToken) {
            return res.status(401).json({ 
              success: false, 
              msg: "Session expired. Please login again." 
            });
          }

          try {
            // Verify refresh token
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JSON_WEB_TOKEN_REFRESH_KEY);
            isRefreshTokenUsed = true;
            console.log("🔄 Access token expired, refresh token used to generate new access token");
          } catch (refreshErr) {
            // Clear invalid tokens
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(401).json({ 
              success: false, 
              msg: "Session expired. Please login again." 
            });
          }
        } else {
          return res.status(401).json({ 
            success: false, 
            msg: "Invalid token. Please login again." 
          });
        }
      }
    }

    // Get user from database
    const user = await this.User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpires', 'otpSentAt'] }
    });

    if (!user) {
      // Clear invalid tokens
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(401).json({ 
        success: false, 
        msg: "User not found. Please login again." 
      });
    }

    // Check if user is active
    if (user.status === 'suspended' || user.status === 'inactive') {
      // Clear tokens on inactive/suspended account
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(403).json({ 
        success: false, 
        msg: "Your account is suspended or inactive. Please contact support." 
      });
    }

    // If refresh token was used, generate new access token
    if (isRefreshTokenUsed) {
      // Generate new access token
      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          isAdmin: user.isAdmin || false,
          role: user.role || 'user'
        },
        process.env.JWT_SECRET || process.env.JSON_WEB_TOKEN_SECRET_KEY,
        { expiresIn: '10m' }
      );

      // Set new access token cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: "lax",
      });

      // Optionally rotate refresh token as well (for better security)
      // Uncomment if you want to rotate refresh token on each use
      /*
      const newRefreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET || process.env.JSON_WEB_TOKEN_REFRESH_KEY,
        { expiresIn: '7d' }
      );
      
      // Update refresh token in database
      user.refreshToken = newRefreshToken;
      await user.save();
      
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
      */
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role || 'user';
    req.isAdmin = user.isAdmin || false;
    req.tokenRefreshed = isRefreshTokenUsed; // Optional: flag to know if token was refreshed

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    // Clear tokens on any error
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(500).json({ 
      success: false, 
      msg: "Internal server error during authentication" 
    });
  }
};

  /**
   * Admin check middleware
   */
  isAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        msg: "Authentication required" 
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        msg: "Forbidden: Admin access required" 
      });
    }

    next();
  };

  /**
   * Role-based middleware
   */
  requireRole = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          msg: "Authentication required" 
        });
      }

      const userRole = req.user.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          success: false, 
          msg: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}` 
        });
      }

      next();
    };
  };

  /**
   * Optional authentication (doesn't throw error if no token)
   */
  optionalAuth = async (req, res, next) => {
    try {
      const token = req.cookies?.accessToken 

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JSON_WEB_TOKEN_SECRET_KEY);
          const user = await this.User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'otp', 'otpExpires', 'otpSentAt'] }
          });
          if (user) {
            req.user = user;
            req.userId = user.id;
          }
        } catch (err) {
          // Token invalid - just proceed without user
        }
      }

      next();
    } catch (error) {
      next();
    }
  };
}

module.exports = AuthMiddleware;