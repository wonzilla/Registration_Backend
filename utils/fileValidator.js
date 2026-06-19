// utils/fileValidator.js
const { ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } = require('../constants/upload.constants');

class FileValidator {
  /**
   * Validate a single file
   * @param {Object} file - Multer file object
   * @param {Object} options - Validation options   
   * @returns {Object} { isValid, error }
   */
  static validate(file, options = {}) {
    const { allowedTypes = null, maxSize = null } = options;

    // Determine allowed types if not specified
    let allowedMimeTypes = allowedTypes;
    if (!allowedMimeTypes) {
      if (file.mimetype.startsWith('image/')) {
        allowedMimeTypes = ALLOWED_MIME_TYPES.image;
      } else if (file.mimetype.startsWith('video/')) {
        allowedMimeTypes = ALLOWED_MIME_TYPES.video;
      } else {
        allowedMimeTypes = ALLOWED_MIME_TYPES.document;
      }
    }

    // Validate file type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`
      };
    }

    // Determine size limit
    let sizeLimit = maxSize;
    if (!sizeLimit) {
      if (file.mimetype.startsWith('image/')) {
        sizeLimit = FILE_SIZE_LIMITS.image;
      } else if (file.mimetype.startsWith('video/')) {
        sizeLimit = FILE_SIZE_LIMITS.video;
      } else {
        sizeLimit = FILE_SIZE_LIMITS.document;
      }
    }

    // Validate file size
    if (file.size > sizeLimit) {
      return {
        isValid: false,
        error: `File too large: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB). Max: ${(sizeLimit / 1024 / 1024).toFixed(0)}MB`
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate multiple files
   * @param {Array} files - Array of Multer file objects
   * @param {Object} options - Validation options
   * @returns {Array} Validation results
   */
  static validateMultiple(files, options = {}) {
    const results = [];
    for (const file of files) {
      results.push({
        file,
        ...this.validate(file, options)
      });
    }
    return results;
  }
}

module.exports = FileValidator;