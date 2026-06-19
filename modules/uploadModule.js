
// modules/uploadModule.js - SINGLE REUSABLE EXPORT
const cloudinary = require('../config/cloudinary');
const UploadService = require('../services/upload');
const UploadController = require('../controllers/upload.controller');
const { upload, uploadSingle, uploadMultiple, uploadFields } = require('../middleware/upload.middleware');
const UploadRateLimiter = require('../middleware/rateLimit.middleware');
const FileValidator = require('../utils/fileValidator');
const ResponseFormatter = require('../utils/responseFormatter');
const FileDeleteService = require('../services/upload/Delete/fileDelete.service');
const FileMoveService = require('../services/upload/fileMove/fileMove.service');

module.exports = {
  UploadService,
  FileDeleteService,
  FileMoveService,
  
  UploadController,
  
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  UploadRateLimiter,
  
  FileValidator,
  ResponseFormatter,
  
  cloudinary
};