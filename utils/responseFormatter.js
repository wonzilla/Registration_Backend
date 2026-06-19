// utils/responseFormatter.js - UPDATED
class ResponseFormatter {

    static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      code: 'SUCCESS',
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    });
  }
  
  static uploadResponse(res, uploadResult, isSingleFile = false) {
    const response = {
      files: uploadResult.successful.map(file => ({
        url: file.url,
        public_id: file.public_id,
        resource_type: file.resource_type,
        format: file.format,
        bytes: file.bytes,
        original_filename: file.original_filename,
        duration: file.duration,
        isPrivate: file.isPrivate
      })),
      failed: uploadResult.failed.map(file => ({
        original_filename: file.original_filename,
        error: file.error
      }))
    };

    let code, message, success;

    if (uploadResult.isCompleteFailure) {
      success = false;
      code = 'UPLOAD_FAILED';
      message = `Upload failed: ${uploadResult.failedCount} file(s) could not be uploaded`;
      
    } else if (uploadResult.isCompleteSuccess) {
      success = true;
      code = 'UPLOAD_SUCCESS';
      message = `${uploadResult.successCount} file(s) uploaded successfully`;
      
    } else {
      success = false;
      code = 'PARTIAL_UPLOAD_SUCCESS';
      message = `${uploadResult.successCount} file(s) uploaded, ${uploadResult.failedCount} failed`;
    }

    // ✅ If single file upload and successful, return object instead of array
    let responseData;
    if (isSingleFile && uploadResult.successful.length === 1) {
      responseData = response.files[0];
    } else {
      responseData = {
        files: response.files,
        failed: response.failed
      };
    }

    return res.status(uploadResult.isCompleteFailure ? 500 : (uploadResult.isPartialSuccess ? 207 : 200)).json({
      success: success,
      code: code,
      message: message,
      file: responseData,
      timestamp: new Date().toISOString()
    });
  }

    static error(res, error, statusCode = 500, code = 'INTERNAL_ERROR') {
    return res.status(statusCode).json({
      success: false,
      code: code,
      message: error.message || 'An error occurred',
      errors: error.errors || [{ field: null, message: error.message }],
      timestamp: new Date().toISOString()
    });
  }
  
}

module.exports = ResponseFormatter;   