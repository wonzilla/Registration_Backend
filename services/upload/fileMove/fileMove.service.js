// src/services/fileMove.service.js
const cloudinary = require('../../../config/cloudinary');
const { UPLOAD_CONFIG } = require('../../../constants/upload.constants');

class FileMoveService {
  /**
   * Move file from temp folder to permanent folder
   */
 static async moveFileToPermanent(tempPublicId, uploadType) {
    const config = UPLOAD_CONFIG[uploadType];
    
    if (!config) {
      throw new Error(`Invalid upload type: ${uploadType}`);
    }

    console.log(`🔵 Moving file: ${tempPublicId} to ${config.permanentFolder}`);

    try {
      // ✅ Detect resource type from public_id or try multiple types
      let fileUrl = null;
      let resourceType = null;
      let found = false;

      // Try to detect resource type based on file extension or content
      const tempPublicIdLower = tempPublicId.toLowerCase();
      const isVideoFile = tempPublicIdLower.includes('.mp4') || 
                          tempPublicIdLower.includes('.mov') || 
                          tempPublicIdLower.includes('.avi') ||
                          tempPublicIdLower.includes('.webm');
      
      const isImageFile = tempPublicIdLower.includes('.jpg') || 
                          tempPublicIdLower.includes('.jpeg') || 
                          tempPublicIdLower.includes('.png') || 
                          tempPublicIdLower.includes('.gif') ||
                          tempPublicIdLower.includes('.webp');

      // Try different resource types in order
      const resourceTypesToTry = [];
      
      if (isVideoFile) {
        resourceTypesToTry.push('video');
      }
      if (isImageFile) {
        resourceTypesToTry.push('image');
      }
      // Always try these as fallback
      resourceTypesToTry.push('video', 'image', 'raw');
      
      // Remove duplicates
      const uniqueResourceTypes = [...new Set(resourceTypesToTry)];
      
      for (const rt of uniqueResourceTypes) {
        try {
          console.log(`🔵 Trying resource type: ${rt}`);
          const resource = await cloudinary.api.resource(tempPublicId, {
            resource_type: rt
          });
          fileUrl = resource.secure_url;
          resourceType = resource.resource_type;
          found = true;
          console.log(`✅ Found resource as ${rt}: ${fileUrl}`);
          break;
        } catch (apiError) {
          console.log(`⚠️ ${rt} fetch failed: ${apiError.message}`);
          continue;
        }
      }

      // If API calls all failed, try constructing URL with correct resource type
      if (!found || !fileUrl) {
        const cloudName = process.env.cloudinary_Config_Cloud_Name;
        
        // Try to determine correct resource type from the temp public_id or URL
        let guessedResourceType = 'image';
        
        if (isVideoFile) {
          guessedResourceType = 'video';
        } else if (isImageFile) {
          guessedResourceType = 'image';
        } else {
          // Try to check if it's a video by looking at the URL from temp upload
          guessedResourceType = 'video'; // Default to video as fallback
        }
        
        // Construct URL with correct resource type
        fileUrl = `https://res.cloudinary.com/${cloudName}/${guessedResourceType}/upload/${tempPublicId}`;
        console.log(`🔵 Using constructed URL with ${guessedResourceType}: ${fileUrl}`);
        
        // Verify if URL is accessible
        try {
          const https = require('https');
          const url = require('url');
          
          const checkUrl = await new Promise((resolve) => {
            const parsedUrl = url.parse(fileUrl);
            const options = {
              hostname: parsedUrl.hostname,
              path: parsedUrl.path,
              method: 'HEAD',
              timeout: 5000
            };
            
            const req = https.request(options, (res) => {
              resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
              req.destroy();
              resolve(false);
            });
            req.end();
          });
          
          if (checkUrl) {
            found = true;
            resourceType = guessedResourceType;
            console.log(`✅ Constructed URL is accessible: ${fileUrl}`);
          } else {
            // Try with different resource type if first guess failed
            const alternativeTypes = guessedResourceType === 'video' ? ['image', 'raw'] : ['video', 'raw'];
            let altFound = false;
            
            for (const altType of alternativeTypes) {
              const altUrl = `https://res.cloudinary.com/${cloudName}/${altType}/upload/${tempPublicId}`;
              console.log(`🔵 Trying alternative with ${altType}: ${altUrl}`);
              
              const altCheck = await new Promise((resolve) => {
                const parsedUrl = url.parse(altUrl);
                const options = {
                  hostname: parsedUrl.hostname,
                  path: parsedUrl.path,
                  method: 'HEAD',
                  timeout: 5000
                };
                
                const req = https.request(options, (res) => {
                  resolve(res.statusCode === 200);
                });
                
                req.on('error', () => resolve(false));
                req.on('timeout', () => {
                  req.destroy();
                  resolve(false);
                });
                req.end();
              });
              
              if (altCheck) {
                altFound = true;
                fileUrl = altUrl;
                resourceType = altType;
                found = true;
                console.log(`✅ Alternative URL works with ${altType}`);
                break;
              }
            }
            
            if (!altFound) {
              throw new Error(`File not accessible at any resource type for: ${tempPublicId}`);
            }
          }
        } catch (urlError) {
          console.error(`❌ URL not accessible: ${urlError.message}`);
          throw new Error(`Cannot access file: ${tempPublicId}. The file may not exist in Cloudinary.`);
        }
      }

      if (!found || !fileUrl || !resourceType) {
        return {
          success: false,
          error: `Cannot access file: ${tempPublicId}. Unable to determine resource type.`,
          oldPublicId: tempPublicId
        };
      }

      // Generate new public_id in permanent folder
      const fileName = tempPublicId.split('/').pop();
      const newPublicId = `${config.permanentFolder}/${fileName}`;
      
      console.log(`🔵 New public_id: ${newPublicId}`);
      console.log(`🔵 Resource type: ${resourceType}`);

      // Upload to new location with correct resource type
      const uploadOptions = {
        public_id: newPublicId,
        folder: config.permanentFolder,
        resource_type: resourceType,
        type: config.isPrivate ? 'authenticated' : 'upload',
        overwrite: true,
        invalidate: true
      };
      
      // Add video-specific options
      if (resourceType === 'video') {
        uploadOptions.eager = [
          { streaming_profile: 'hd', format: 'm3u8' },
          { format: 'mp4', transformation: { quality: 'auto' } }
        ];
        uploadOptions.eager_async = true;
      }
      
      const result = await cloudinary.uploader.upload(fileUrl, uploadOptions);

      console.log(`✅ File moved successfully: ${result.secure_url}`);

      // Delete temp file (optional)
      try {
        await cloudinary.uploader.destroy(tempPublicId, {
          resource_type: resourceType,
          invalidate: true
        });
        console.log(`✅ Temp file deleted: ${tempPublicId}`);
      } catch (deleteError) {
        console.warn(`⚠️ Could not delete temp file: ${deleteError.message}`);
        // Don't fail the whole operation if delete fails
      }

      return {
        success: true,
        oldPublicId: tempPublicId,
        newPublicId: result.public_id,
        newUrl: result.secure_url,
        folder: config.permanentFolder,
        resourceType: resourceType
      };
      
    } catch (error) {
      console.error('Move file error:', {
        tempPublicId,
        uploadType,
        errorMessage: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        error: error.message,
        oldPublicId: tempPublicId
      };
    }
  }

  /**
   * Move multiple files to permanent storage
   */
  static async moveMultipleFiles(tempUploads, uploadType) {
    const results = {
      successful: [],
      failed: [],
      total: tempUploads.length
    };

    for (const upload of tempUploads) {
      const result = await this.moveFileToPermanent(upload.fileId, uploadType);
      
      if (result.success) {
        results.successful.push({
          tempId: upload.id,
          ...result
        });
      } else {
        results.failed.push({
          tempId: upload.id,
          error: result.error
        });
      }
    }

    return results;
  }
}

module.exports = FileMoveService;