// src/routes/uploadRoutes.js
const express = require('express');
const { uploadSingle, uploadMultiple } = require('../../middleware/upload.middleware');
const UploadController = require('../../controllers/upload.controller');
const router = express.Router();

// Public temp upload (no auth required for teacher registration)
router.post(
  '/temp',
  uploadSingle('image'),
  UploadController.uploadToTemp
);

router.post(
  '/temp/multiple',
  uploadMultiple('images', 10),
  UploadController.uploadMultipleToTemp
);

// Direct upload (existing)
router.post('/', uploadSingle('image'), UploadController.uploadFiles);

// Delete file
router.delete('/delete',  UploadController.deleteFile);

// Get signed URL for private file
router.post('/signed-url',  UploadController.getSignedUrl);

module.exports = router;