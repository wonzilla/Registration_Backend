// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Validate configuration
const requiredEnvVars = [
  'cloudinary_Config_Cloud_Name',
  'cloudinary_Config_api_key',
  'cloudinary_Config_api_secret'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing Cloudinary configuration: ${envVar}`);
  }
}

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
   upload: {
    timeout: 120000,
    chunk_size: 20 * 1024 * 1024 // 20MB chunks for large files
  }
});

module.exports = cloudinary;