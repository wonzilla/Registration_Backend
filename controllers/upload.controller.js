// src/controllers/upload.controller.js
const ResponseFormatter = require('../utils/responseFormatter');
const FileValidator = require('../utils/fileValidator');
const { UPLOAD_CONFIG } = require('../constants/upload.constants');
const TempUploadService = require('../services/upload/tempUpload/tempUpload.service');
const UploadService = require('../services/upload');
const FileDeleteService = require('../services/upload/Delete/fileDelete.service');

class UploadController {

static async uploadToTemp(req, res) {
  console.log("request received to temp upload")
  try {
    const { type } = req.body;
    const config = UPLOAD_CONFIG[type];

    if (!config) {
      return ResponseFormatter.error(res, {
        message: 'Invalid upload type',
        errors: [{ field: 'type', message: 'Please provide a valid upload type' }]
      }, 400, 'VALIDATION_ERROR');
    }

    // Security check for non-public uploads
    if (!config.public) {
      if (!req.user) {
        return ResponseFormatter.error(res, {
          message: 'Authentication required',
          errors: [{ field: 'auth', message: 'Please login to upload' }]
        }, 401, 'UNAUTHORIZED');
      }

      // ✅ FIXED: Check both req.user.role and req.user.roles array
      const userRole = req.member.role.name;
      const userRoles = req.member.roles || [];

      console.log(userRole , "userRole")
      
      // Convert to uppercase for comparison
      const userRoleUpper = userRole?.toUpperCase();
      const userRolesUpper = userRoles.map(r => r.name?.toUpperCase());
      const allowedRolesUpper = config.roles.map(r => r.toUpperCase());
      
      // Check if user has any allowed role
      let hasPermission = false;
      
      // Check single role
      if (userRoleUpper && allowedRolesUpper.includes(userRoleUpper)) {
        hasPermission = true;
      }
      
      // Check roles array
      if (!hasPermission && userRolesUpper.length > 0) {
        hasPermission = userRolesUpper.some(role => allowedRolesUpper.includes(role));
      }
      
      // Debug log
      console.log('🔐 Role check:', {
        userRole,
        userRoles,
        allowedRoles: config.roles,
        hasPermission
      });
      
      if (!hasPermission) {
        return ResponseFormatter.error(res, {
          message: 'Unauthorized',
          errors: [{ field: 'role', message: `Only ${config.roles.join(', ')} can upload` }]
        }, 403, 'FORBIDDEN');
      }
    }

    // ✅ Rest of your code remains the same...
    const isSingleFile = !!req.file;
    let files = [];
    
    if (req.file) {
      files = [req.file];
    } else if (req.files && req.files.length > 0) {
      files = req.files;
    } else if (req.files && typeof req.files === 'object') {
      files = Object.values(req.files).flat();
    }

    if (files.length === 0) {
      return ResponseFormatter.error(res, {
        message: 'No files uploaded',
        errors: [{ field: 'files', message: 'At least one file is required' }]
      }, 400, 'VALIDATION_ERROR');
    }

    const validationResults = FileValidator.validateMultiple(files, {
      allowedTypes: config.allowedTypes,
      maxSize: config.maxSize
    });

    const invalidFiles = validationResults.filter(r => !r.isValid);
    if (invalidFiles.length > 0) {
      if (isSingleFile && invalidFiles.length === files.length) {
        return ResponseFormatter.error(res, {
          message: invalidFiles[0].error,
          errors: invalidFiles.map(f => ({ field: 'files', message: f.error }))
        }, 400, 'VALIDATION_ERROR');
      }
      
      files = validationResults.filter(r => r.isValid).map(r => r.file);
      
      if (files.length === 0) {
        return ResponseFormatter.error(res, {
          message: 'All files failed validation',
          errors: invalidFiles.map(f => ({ field: 'files', message: f.error }))
        }, 400, 'VALIDATION_ERROR');
      }
    }

    const uploadResults = await UploadService.uploadMultipleFiles(files, {
      folder: config.folder,
      isPrivate: config.isPrivate
    });

    if (uploadResults.successCount === 0) {
      return ResponseFormatter.error(res, {
        message: 'Upload failed',
        errors: uploadResults.failed.map(f => ({ field: 'files', message: f.error }))
      }, 500, 'UPLOAD_FAILED');
    }

    const tempRecords = [];
    for (const file of uploadResults.successful) {
      const tempRecord = await TempUploadService.saveTempUpload(file, type);
      tempRecords.push({
        id: tempRecord.id,
        url: tempRecord.fileUrl,
        public_id: file.public_id,
        expiresAt: tempRecord.expiresAt,
        bytes: file.bytes,
        format: file.format,
        width: file.width,
        height: file.height,
        mimetype: file.mimetype,
        original_filename: file.original_filename
      });
    }

    if (isSingleFile && tempRecords.length === 1) {
      return ResponseFormatter.success(res, tempRecords[0], 'File uploaded successfully');
    }

    return ResponseFormatter.success(res, {
      uploads: tempRecords,
      summary: {
        total: uploadResults.total,
        uploaded: uploadResults.successCount,
        failed: uploadResults.failedCount,
        ttl: config.ttl,
        expiresIn: `${config.ttl} hours`
      }
    }, `${tempRecords.length} file(s) uploaded successfully`);

  } catch (error) {
    console.error('Temp upload error:', error);
    return ResponseFormatter.error(res, error);
  }
}

static async uploadMultipleToTemp(req, res) {
  try {
    const { type } = req.body;
    const config = UPLOAD_CONFIG[type];

    if (!config) {
      return ResponseFormatter.error(res, {
        message: 'Invalid upload type',
        errors: [{ field: 'type', message: 'Please provide a valid upload type' }]
      }, 400, 'VALIDATION_ERROR');
    }

    let files = req.files || [];
    if (files.length === 0) {
      return ResponseFormatter.error(res, {
        message: 'No files uploaded',
        errors: [{ field: 'files', message: 'At least one file is required' }]
      }, 400, 'VALIDATION_ERROR');
    }

    // Upload all files
    const uploadResults = await UploadService.uploadMultipleFiles(files, {
      folder: config.folder,
      isPrivate: config.isPrivate
    });

    if (uploadResults.successCount === 0) {
      return ResponseFormatter.error(res, {
        message: 'Upload failed',
        errors: uploadResults.failed.map(f => ({ field: 'files', message: f.error }))
      }, 500, 'UPLOAD_FAILED');
    }

    // Save temp records
    const tempRecords = [];
    for (const file of uploadResults.successful) {
      const tempRecord = await TempUploadService.saveTempUpload(file, type);
      tempRecords.push({
        id: tempRecord.id,
        url: tempRecord.fileUrl,
        public_id: file.public_id,
        expiresAt: tempRecord.expiresAt
      });
    }

    return ResponseFormatter.success(res, {
      uploads: tempRecords,
      summary: {
        total: uploadResults.total,
        uploaded: uploadResults.successCount,
        failed: uploadResults.failedCount,
        ttl: config.ttl
      }
    }, `${tempRecords.length} file(s) uploaded successfully`);

  } catch (error) {
    console.error('Multiple temp upload error:', error);
    return ResponseFormatter.error(res, error);
  }
}


 static async uploadFiles(req, res) {
    try {
      const { folder, isPrivate, allowedTypes, maxSize } = req.body;
      
      if (!folder) {
        return ResponseFormatter.error(res, {
          message: 'Folder name is required',
          errors: [{ field: 'folder', message: 'Folder name must be provided' }]
        }, 400, 'VALIDATION_ERROR');
      }

      // Get files from request
      let files = [];
      if (req.file) {
        files = [req.file];
      } else if (req.files && req.files.length > 0) {
        files = req.files;
      } else if (req.files && typeof req.files === 'object') {
        files = Object.values(req.files).flat();
      }

      if (files.length === 0) {
        return ResponseFormatter.error(res, {
          message: 'No files uploaded',
          errors: [{ field: 'files', message: 'At least one file is required' }]
        }, 400, 'VALIDATION_ERROR');
      }

      // Validate files
      const validationResults = FileValidator.validateMultiple(files, {
        allowedTypes: allowedTypes ? JSON.parse(allowedTypes) : null,
        maxSize: maxSize ? parseInt(maxSize) : null
      });

      const invalidFiles = validationResults.filter(r => !r.isValid);
      if (invalidFiles.length > 0) {
        // ✅ If ALL files are invalid, return error
        if (invalidFiles.length === files.length) {
          return ResponseFormatter.error(res, {
            message: 'All files failed validation',
            errors: invalidFiles.map(f => ({
              field: 'files',
              message: f.error
            }))
          }, 400, 'VALIDATION_ERROR');
        }
        
        // Filter out invalid files
        files = validationResults.filter(r => r.isValid).map(r => r.file);
        
        // If no valid files remain after filtering
        if (files.length === 0) {
          return ResponseFormatter.error(res, {
            message: 'No valid files to upload',
            errors: invalidFiles.map(f => ({
              field: 'files',
              message: f.error
            }))
          }, 400, 'VALIDATION_ERROR');
        }
      }

      const isPrivateFolder = isPrivate === 'true' || isPrivate === true;
       const isSingleFile = req.file && !req.files; // Check if single file upload
      
      // ✅ Add timeout and retry logic for better reliability
      const uploadResult = await this.uploadWithRetry(files, {
        folder: folder,
        isPrivate: isPrivateFolder
      });

        return ResponseFormatter.uploadResponse(res, uploadResult, isSingleFile);
      
    } catch (error) {
      console.error('Upload controller error:', error);
      return ResponseFormatter.error(res, error);
    }
  }

  static async uploadWithRetry(files, options, maxRetries = 2) {
    const results = {
      successful: [],
      failed: [],
      total: files.length,
      successCount: 0,
      failedCount: 0
    };

    for (const file of files) {
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await UploadService.uploadSingleFile(file, options);
          
          if (result.success) {
            results.successful.push(result);
            results.successCount++;
            break; // Success, exit retry loop
          } else {
            lastError = result.error;
            if (attempt === maxRetries) {
              results.failed.push({
                original_filename: file.originalname,
                error: lastError
              });
              results.failedCount++;
            }
          }
        } catch (error) {
          lastError = error.message;
          console.error(`Upload attempt ${attempt} failed for ${file.originalname}:`, error);
          
          if (attempt === maxRetries) {
            results.failed.push({
              original_filename: file.originalname,
              error: lastError || 'Upload failed after retries'
            });
            results.failedCount++;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    }

    results.isCompleteFailure = results.successCount === 0 && files.length > 0;
    results.isCompleteSuccess = results.failedCount === 0 && files.length > 0;
    results.isPartialSuccess = results.successCount > 0 && results.failedCount > 0;

    return results;
  }


  static async deleteFile(req, res) {
    try {
      const { public_id, resource_type = 'image' } = req.query;

      if (!public_id) {
        return ResponseFormatter.error(res, {
          message: 'Public ID is required',
          errors: [{ field: 'public_id', message: 'Public ID must be provided' }]
        }, 400, 'VALIDATION_ERROR');
      }

      const result = await FileDeleteService.deleteFile(public_id, resource_type);

      if (result.success) {
        return ResponseFormatter.success(res, result, 'File deleted successfully');
      } else {
        return ResponseFormatter.error(res, {
          message: result.error,
          errors: [{ field: 'public_id', message: result.error }]
        }, 404, 'FILE_NOT_FOUND');
      }
    } catch (error) {
      return ResponseFormatter.error(res, error);
    }
  }

  static async deleteMultipleFiles(req, res) {
    try {
      const { files } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return ResponseFormatter.error(res, {
          message: 'Files array is required',
          errors: [{ field: 'files', message: 'At least one file to delete is required' }]
        }, 400, 'VALIDATION_ERROR');
      }

      const result = await FileDeleteService.deleteMultipleFiles(files);

      const response = {
        total: result.total,
        successful: result.successCount,
        failed: result.failedCount,
        results: {
          successful: result.successful,
          failed: result.failed
        }
      };

      const message = result.failedCount === 0
        ? `${result.successCount} file(s) deleted successfully`
        : `${result.successCount} file(s) deleted, ${result.failedCount} failed`;

      return ResponseFormatter.success(res, response, message);
    } catch (error) {
      return ResponseFormatter.error(res, error);
    }
  }


  static async getSignedUrl(req, res) {
    try {
      const { public_id, expiry = 3600, options = {} } = req.body;

      if (!public_id) {
        return ResponseFormatter.error(res, {
          message: 'Public ID is required',
          errors: [{ field: 'public_id', message: 'Public ID must be provided' }]
        }, 400, 'VALIDATION_ERROR');
      }

      const signedUrl = UploadService.generateSignedUrl(public_id, {
        expiry: expiry,
        ...options
      });

      return ResponseFormatter.success(res, {
        url: signedUrl,
        public_id: public_id,
        expires_in: expiry,
        expires_at: new Date(Date.now() + expiry * 1000).toISOString()
      }, 'Signed URL generated successfully');
    } catch (error) {
      return ResponseFormatter.error(res, error);
    }
  }
}

module.exports = UploadController;