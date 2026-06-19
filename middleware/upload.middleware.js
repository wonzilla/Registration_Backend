// middleware/upload.middleware.js
const multer = require('multer');
const FileValidator = require('../utils/fileValidator');

// Use memory storage - NO DISK STORAGE
const storage = multer.memoryStorage();

// Custom file filter with validation
const fileFilter = (req, file, cb) => {
  const validation = FileValidator.validate(file);
  if (validation.isValid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max overall
    files: 20 // Max 20 files per request
  }
});

// Helper to handle single file
const uploadSingle = (fieldName) => upload.single(fieldName);

// Helper to handle multiple files
const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

// Helper for mixed fields
const uploadFields = (fields) => upload.fields(fields);

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields
};