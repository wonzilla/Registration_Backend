// services/upload.service.js
const cloudinary = require('../../config/cloudinary');
const { PRIVATE_FOLDERS } = require('../../constants/upload.constants');

class UploadService {
  /**
   * Determine resource type from mimetype
   */
static getResourceType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('application/pdf')) return 'image'; // OK for preview
  return 'raw';
}

  /**
   * Check if folder should be private
   */
static isPrivateFolder(folderPath) {

  console.log(folderPath)
  // ✅ Add null/undefined check
  if (!folderPath) return false;
  
  const { PRIVATE_FOLDERS } = require('../../constants/upload.constants');
  return PRIVATE_FOLDERS.some(privateFolder => 
    folderPath.startsWith(privateFolder)
  );
}

  /**
   * Get upload options based on folder and file
   */
static getUploadOptions(file, folder, isPrivate = null) {
  const resourceType = this.getResourceType(file.mimetype);

  const shouldBePrivate =
    isPrivate !== null ? isPrivate : this.isPrivateFolder(folder);

  console.log(shouldBePrivate, "should be private");

  const options = {
    folder,
    use_filename: true,
    overwrite: false
  };

  // 🔥 PDF HANDLING (CLEAN FIX)
  if (file.mimetype === 'application/pdf') {
    options.resource_type = 'image';
    options.format = 'pdf';
    options.type = 'upload'; // FORCE PUBLIC

  } 
  // 🎥 VIDEO HANDLING
  else if (resourceType === 'video') {
    options.resource_type = 'video';
    options.type = shouldBePrivate ? 'authenticated' : 'upload';

    options.eager = [
      { width: 1280, height: 720, crop: 'limit', format: 'mp4' },
      { width: 640, height: 480, crop: 'limit', format: 'jpg' }
    ];

    options.eager_async = true;
  } 
  // 🖼️ IMAGE / RAW HANDLING
  else {
    options.resource_type = resourceType;
    options.type = shouldBePrivate ? 'authenticated' : 'upload';
  }

  return options;
}
  /**
   * Upload single file to Cloudinary
   */
static async uploadSingleFile(file, options = {}) {
  try {
    const { folder, isPrivate, ...extraOptions } = options;
    
    // ✅ Ensure folder is defined
    if (!folder) {
      throw new Error('Folder is required for upload');
    }
    
    const uploadOptions = this.getUploadOptions(file, folder, isPrivate);
    uploadOptions.upload_preset = 'ml_public';

    console.log(uploadOptions , "upload Options")
    Object.assign(uploadOptions, extraOptions);

    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    // Add timeout promise wrapper
    const uploadPromise = cloudinary.uploader.upload(base64File, uploadOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout after 120 seconds')), 120000);
    });
    
    const result = await Promise.race([uploadPromise, timeoutPromise]);

    // ✅ Fix: Check if folder is defined before calling isPrivateFolder
    const isFolderPrivate = folder ? this.isPrivateFolder(folder) : (isPrivate || false);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      original_filename: file.originalname,
      mimetype: file.mimetype,
      duration: result.duration || null,
      width: result.width || null,
      height: result.height || null,
      isPrivate: isFolderPrivate
    };
    
  } catch (error) {
    console.error('Upload error details:', {
      fileName: file.originalname,
      fileSize: file.size,
      errorMessage: error.message,
      errorCode: error.http_code
    });
    
    // Specific error messages based on error type
    let errorMessage = error.message;
    if (error.http_code === 499 || error.message?.includes('Timeout')) {
      errorMessage = 'Upload timeout - file may be too large or network slow';
    } else if (error.http_code === 413) {
      errorMessage = 'File too large for Cloudinary';
    } else if (error.http_code === 400) {
      errorMessage = 'Invalid file format or corrupted file';
    }
    
    return {
      success: false,
      error: errorMessage,
      original_filename: file.originalname
    };
  }
}

  /**
   * Upload multiple files to Cloudinary
   */
  static async uploadMultipleFiles(files, options = {}) {
    const uploadPromises = files.map(file => this.uploadSingleFile(file, options));
    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failedCount: failed.length,
      // ✅ ADD THIS: Flag to know if it was complete failure
      isCompleteFailure: successful.length === 0 && files.length > 0,
      isCompleteSuccess: failed.length === 0 && files.length > 0,
      isPartialSuccess: successful.length > 0 && failed.length > 0
    };
  }
  /**
   * Generate signed URL for private file
   */
  static generateSignedUrl(publicId, options = {}) {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiry = options.expiry || 3600; // Default 1 hour
    
    const signedUrl = cloudinary.utils.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: timestamp + expiry,
      secure: true,
      ...options
    });
    
    return signedUrl;
  }

  /**
   * Get file details from Cloudinary
   */
  static async getFileDetails(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = UploadService;