// middleware/rateLimit.middleware.js
const userUploadMap = new Map();

class UploadRateLimiter {
  constructor(options = {}) {
    this.windowTime = options.windowTime || 30 * 60 * 1000; // 30 minutes
    this.maxUploads = options.maxUploads || 10;
  }

  middleware() {
    return (req, res, next) => {
      const userId = req.user?.id || req.user?.entityId || req.ip;
      const now = Date.now();

      if (!userUploadMap.has(userId)) {
        userUploadMap.set(userId, []);
      }

      let uploads = userUploadMap.get(userId);
      
      // Clean old entries
      uploads = uploads.filter(time => now - time < this.windowTime);
      
      if (uploads.length >= this.maxUploads) {
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Upload limit reached. Please try again after ${this.windowTime / 60000} minutes.`
        });
      }

      uploads.push(now);
      userUploadMap.set(userId, uploads);
      next();
    };
  }

  // Cleanup method (optional - run periodically)
  static cleanup() {
    const now = Date.now();
    for (const [userId, uploads] of userUploadMap.entries()) {
      const validUploads = uploads.filter(time => now - time < 30 * 60 * 1000);
      if (validUploads.length === 0) {
        userUploadMap.delete(userId);
      } else {
        userUploadMap.set(userId, validUploads);
      }
    }
  }
}

// Run cleanup every hour
setInterval(() => UploadRateLimiter.cleanup(), 60 * 60 * 1000);

module.exports = UploadRateLimiter;