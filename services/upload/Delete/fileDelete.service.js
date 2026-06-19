// services/fileDelete.service.js
const cloudinary = require('../../../config/cloudinary');

class FileDeleteService {
  /**
   * Delete single file from Cloudinary
   */
  static async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
      });

      if (result.result === 'ok') {
        return {
          success: true,
          message: 'File deleted successfully',
          publicId: publicId
        };
      } else if (result.result === 'not found') {
        return {
          success: false,
          error: 'File not found',
          publicId: publicId
        };
      } else {
        return {
          success: false,
          error: `Deletion failed: ${result.result}`,
          publicId: publicId
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        publicId: publicId
      };
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  static async deleteMultipleFiles(files) {
    const deletionPromises = files.map(file => 
      this.deleteFile(file.public_id, file.resource_type || 'image')
    );
    
    const results = await Promise.all(deletionPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failedCount: failed.length
    };
  }

  /**
   * Delete folder and all its contents
   */
  static async deleteFolder(folderPath) {
    try {
      // First, get all resources in folder
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 500
      });

      if (resources.resources.length === 0) {
        return {
          success: true,
          message: 'Folder is empty or does not exist',
          deletedCount: 0
        };
      }

      // Delete all resources
      const publicIds = resources.resources.map(r => r.public_id);
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'image',
        invalidate: true
      });

      return {
        success: true,
        message: `Deleted ${publicIds.length} files from folder`,
        deletedCount: publicIds.length,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FileDeleteService;