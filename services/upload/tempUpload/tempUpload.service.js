// src/services/tempUpload.service.js
const { v4: uuidv4 } = require('uuid');
const { TempUpload } = require('../../../models');
const cloudinary = require('../../../config/cloudinary');
const { UPLOAD_CONFIG } = require('../../../constants/upload.constants');

class TempUploadService {
  /**
   * Save temp upload record
   */
  static async saveTempUpload(fileData, uploadType) {
    const config = UPLOAD_CONFIG[uploadType];
    if (!config) {
      throw new Error(`Invalid upload type: ${uploadType}`);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.ttl);

    const tempUpload = await TempUpload.create({
      id: uuidv4(),
      fileId: fileData.public_id,
      fileUrl: fileData.url,
      filePath: fileData.folder || config.folder,
      fileName: fileData.original_filename || fileData.originalname,
      fileSize: fileData.bytes || fileData.size,
      mimeType: fileData.mimetype || fileData.format,
      uploadType: uploadType,
      metadata: {
        width: fileData.width,
        height: fileData.height,
        format: fileData.format
      },
      isUsed: false,
      expiresAt: expiresAt
    });

    return tempUpload;
  }

  /**
   * Mark temp upload as used and move to permanent
   */
  static async markAsUsedAndMove(tempUploadId, newPublicId, newUrl, newFolder) {
    const tempUpload = await TempUpload.findByPk(tempUploadId);
    
    if (!tempUpload) {
      throw new Error('Temp upload not found');
    }

    await tempUpload.update({
      isUsed: true,
      metadata: {
        ...tempUpload.metadata,
        movedTo: newPublicId,
        movedAt: new Date().toISOString(),
        permanentFolder: newFolder
      }
    });

    return tempUpload;
  }

  /**
   * Get temp upload by ID
   */
  static async getTempUpload(id) {
    return await TempUpload.findByPk(id);
  }

  /**
   * Get unused temp uploads by type
   */
  static async getUnusedUploadsByType(uploadType) {
    return await TempUpload.findAll({
      where: {
        uploadType: uploadType,
        isUsed: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });
  }

  /**
   * Delete expired and unused temp uploads from Cloudinary and DB
   */
  static async deleteExpiredUnusedUploads() {
    const { Op } = require('sequelize');
    
    const expiredUploads = await TempUpload.findAll({
      where: {
        isUsed: false,
        expiresAt: { [Op.lt]: new Date() }
      }
    });

    const results = {
      deleted: [],
      failed: [],
      total: expiredUploads.length
    };

    for (const upload of expiredUploads) {
      try {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(upload.fileId, {
          resource_type: upload.mimeType?.startsWith('video') ? 'video' : 'image',
          invalidate: true
        });
        
        // Delete from database
        await upload.destroy();
        
        results.deleted.push({
          id: upload.id,
          fileId: upload.fileId,
          fileName: upload.fileName
        });
      } catch (error) {
        console.error(`Failed to delete temp upload ${upload.id}:`, error);
        results.failed.push({
          id: upload.id,
          fileId: upload.fileId,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = TempUploadService;