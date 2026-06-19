const { sendResponse } = require("../../helper/responseHelper");
const { sequelize } = require("../../models");
const { FileMoveService } = require("../../modules/uploadModule");

class RegistrationController {
  constructor(registrationService) {
    this.registrationService = registrationService;
  }

  // Create new registration (WITHOUT payment)
  createRegistration = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
      const {
        userId,
        courseId,
        courseName,
        courseCategory,
        fullName,
        email,
        whatsappNumber,
        phoneNumber,
        address,
        city,
        qualification,
        reason,
        previousExperience,
        notes
      } = req.body;

      // Validate required fields
      const requiredFields = ['userId', 'courseId', 'courseName', 'fullName', 'email', 'whatsappNumber', 'reason'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return sendResponse(req, res, {
          statusCode: 400,
          success: false,
          code: "MISSING_FIELDS",
          message: "Missing required fields",
          errors: missingFields
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendResponse(req, res, {
          statusCode: 400,
          success: false,
          code: "INVALID_EMAIL",
          message: "Invalid email format"
        });
      }

      // Validate whatsapp number
      const whatsappRegex = /^\+?[0-9]{10,15}$/;
      if (!whatsappRegex.test(whatsappNumber.replace(/\s/g, ''))) {
        return sendResponse(req, res, {
          statusCode: 400,
          success: false,
          code: "INVALID_WHATSAPP",
          message: "Invalid WhatsApp number format"
        });
      }

      const registrationData = {
        userId,
        courseId,
        courseName,
        courseCategory: courseCategory || "other",
        fullName,
        email: email.toLowerCase(),
        whatsappNumber,
        phoneNumber,
        address,
        city: city || "Chiniot",
        qualification,
        reason,
        previousExperience,
        notes,
        status: "pending",
        paymentStatus: "pending",
      };

      const registration = await this.registrationService.createRegistration(
        registrationData,
        t
      );

      await t.commit();

      return sendResponse(req, res, {
        statusCode: 201,
        success: true,
        code: "SUCCESS",
        message: "Registration submitted successfully! Please wait for admin approval.",
        data: {
          registrationNumber: registration.registrationNumber,
          courseName: registration.courseName,
          fullName: registration.fullName,
          email: registration.email,
          whatsappNumber: registration.whatsappNumber,
          discountedFee: registration.discountedFeeAmount,
          originalFee: registration.originalFeeAmount,
          status: registration.status,
          paymentStatus: registration.paymentStatus
        }
      });

    } catch (error) {
      await t.rollback();
      console.error('Create Registration Error:', error);
      return sendResponse(req, res, {
        statusCode: error.message.includes("already registered") ? 400 : 500,
        success: false,
        code: "REGISTRATION_ERROR",
        message: error.message || "Registration failed"
      });
    }
  };

  // Get user's own registrations
  getMyRegistrations = async (req, res) => {
    try {
      const userId = req.params.userId || req.user?.id;
      const { status, courseName, search, page, limit } = req.query;
      
      const result = await this.registrationService.getMyRegistrations(userId, {
        status,
        courseName,
        search,
        page,
        limit
      });

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: "Your registrations retrieved successfully",
        data: result.registrations,
        meta: result.pagination
      });

    } catch (error) {
      console.error('Get My Registrations Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "INTERNAL_ERROR",
        message: "Failed to fetch registrations"
      });
    }
  };


  // Get user's registered courses (for course list page)
getMyRegisteredCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "MISSING_USER_ID",
        message: "User ID is required"
      });
    }

    const registrations = await this.registrationService.getMyRegisteredCourses(userId);

    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "SUCCESS",
      message: "Registered courses retrieved successfully",
      data: registrations
    });

  } catch (error) {
    console.error('Get My Registered Courses Error:', error);
    return sendResponse(req, res, {
      statusCode: 500,
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to fetch registered courses"
    });
  }
};


  // Update registration status (Approve/Reject)
  updateRegistrationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminRemarks } = req.body;
      const email = req.user.email;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return sendResponse(req, res, {
          statusCode: 400,
          success: false,
          code: "INVALID_STATUS",
          message: "Invalid status value. Must be pending, approved, or rejected"
        });
      }

      const registration = await this.registrationService.updateRegistrationStatus(
        id, 
        status, 
        adminRemarks,
        email
      );

      const responseMessage = status === 'approved' 
        ? `Registration approved! Please complete payment within 3 days to get discounted fee.`
        : status === 'rejected'
        ? `Registration rejected`
        : `Registration status updated to ${status}`;

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: responseMessage,
        data: {
          registration,
          paymentDeadline: registration.paymentDeadline,
          discountedFee: registration.discountedFeeAmount,
          originalFee: registration.originalFeeAmount,
          isWithinDeadline: registration.paymentDeadline ? new Date() <= new Date(registration.paymentDeadline) : false
        }
      });

    } catch (error) {
      console.error('Update Registration Status Error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "UPDATE_STATUS_ERROR",
        message: error.message || "Failed to update status"
      });
    }
  };

  // Process payment (after approval)
  processPayment = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { paymentMethod, transactionId, tempUploadId } = req.body;
      const email = req.user.email;

      // Validate required fields
      if (!paymentMethod) {
        return sendResponse(req, res, {
          statusCode: 400,
          success: false,
          code: "MISSING_FIELDS",
          message: "Payment method is required"
        });
      }

      // Handle payment screenshot from temp upload
      let paymentScreenshotFile = null;
      if (tempUploadId) {
        const TempUpload = this.registrationService.models.TempUpload;
        
        const tempUpload = await TempUpload.findByPk(tempUploadId, { transaction: t });
        
        if (!tempUpload) {
          return sendResponse(req, res, {
            statusCode: 404,
            success: false,
            code: "TEMP_UPLOAD_NOT_FOUND",
            message: "Temporary upload not found"
          });
        }
        
        if (tempUpload.isUsed) {
          return sendResponse(req, res, {
            statusCode: 400,
            success: false,
            code: "TEMP_UPLOAD_ALREADY_USED",
            message: "Temporary upload has already been used"
          });
        }
        
        const moveResult = await FileMoveService.moveFileToPermanent(
          tempUpload.fileId,
          'registration-payment'
        );
        
        if (moveResult.success) {
          paymentScreenshotFile = {
            url: moveResult.newUrl,
            public_id: moveResult.newPublicId,
            tempUploadId: tempUploadId
          };
          
          await tempUpload.update({
            isUsed: true,
            metadata: {
              ...tempUpload.metadata,
              movedTo: moveResult.newPublicId,
              movedAt: new Date()
            }
          }, { transaction: t });
        }
      }

      const result = await this.registrationService.processPayment(id, {
        paymentMethod,
        transactionId,
        paymentScreenshotFile,
        email
      });

      await t.commit();

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: "Payment completed successfully!",
        data: {
          registration: result.registration,
          payment: result.payment,
          amountPaid: result.payment.amount,
          isDiscounted: result.payment.isDiscounted
        }
      });

    } catch (error) {
      await t.rollback();
      console.error('Process Payment Error:', error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "PAYMENT_ERROR",
        message: error.message || "Failed to process payment"
      });
    }
  };

  // Get registration by ID (Admin)
  getRegistrationById = async (req, res) => {
    try {
      const { id } = req.params;
      const registration = await this.registrationService.getRegistrationById(id);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: "Registration retrieved successfully",
        data: registration
      });

    } catch (error) {
      console.error('Get Registration By ID Error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "NOT_FOUND",
        message: error.message || "Registration not found"
      });
    }
  };

  // Get all registrations (Admin)
  getAllRegistrations = async (req, res) => {
    try {
      const { status, courseName, search, page, limit } = req.query;
      
      const result = await this.registrationService.getAllRegistrations({
        status,
        courseName,
        search,
        page,
        limit
      });

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: "Registrations retrieved successfully",
        data: result.registrations,
        meta: result.pagination
      });

    } catch (error) {
      console.error('Get All Registrations Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "INTERNAL_ERROR",
        message: "Failed to fetch registrations"
      });
    }
  };

  // Delete registration (Admin)
  deleteRegistration = async (req, res) => {
    try {
      const { id } = req.params;
      await this.registrationService.deleteRegistration(id);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: "Registration deleted successfully"
      });

    } catch (error) {
      console.error('Delete Registration Error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "NOT_FOUND",
        message: error.message || "Registration not found"
      });
    }
  };

  // Get registration statistics (Admin)
  getRegistrationStats = async (req, res) => {
    try {
      const stats = await this.registrationService.getRegistrationStats();

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: "Registration statistics retrieved successfully",
        data: stats
      });

    } catch (error) {
      console.error('Get Registration Stats Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "INTERNAL_ERROR",
        message: "Failed to fetch registration statistics"
      });
    }
  };

  // Get all registrations with full details (Admin)
  getAllRegistrationsFull = async (req, res) => {
    try {
      const { status, courseName, paymentStatus, search, startDate, endDate } = req.query;
      
      const result = await this.registrationService.getAllRegistrationsFull({
        status,
        courseName,
        paymentStatus,
        search,
        startDate,
        endDate
      });

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SUCCESS",
        message: "All registrations retrieved successfully",
        data: result.registrations,
        meta: {
          total: result.total,
          filters: { status, courseName, paymentStatus, search, startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Get All Registrations Full Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "INTERNAL_ERROR",
        message: "Failed to fetch registrations"
      });
    }
  };




  // Update payment status (Admin)
updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, adminRemarks } = req.body;
    const email = req.user.email;

    if (!['pending', 'review', 'completed', 'failed'].includes(paymentStatus)) {
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "INVALID_STATUS",
        message: "Invalid payment status value"
      });
    }

    const result = await this.registrationService.updatePaymentStatus(
      id,
      paymentStatus,
      adminRemarks,
      email
    );

    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "SUCCESS",
      message: `Payment status updated to ${paymentStatus}`,
      data: result
    });

  } catch (error) {
    console.error('Update Payment Status Error:', error);
    return sendResponse(req, res, {
      statusCode: 404,
      success: false,
      code: "UPDATE_PAYMENT_STATUS_ERROR",
      message: error.message || "Failed to update payment status"
    });
  }
};

// Get review payment registrations (Admin)
getReviewPaymentRegistrations = async (req, res) => {
  try {
    const { status, courseName, search, page, limit } = req.query;
    
    const result = await this.registrationService.getReviewPaymentRegistrations({
      status,
      courseName,
      search,
      page,
      limit
    });

    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "SUCCESS",
      message: "Review payment registrations retrieved successfully",
      data: result.registrations,
      meta: result.pagination
    });

  } catch (error) {
    console.error('Get Review Payment Registrations Error:', error);
    return sendResponse(req, res, {
      statusCode: 500,
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to fetch review payment registrations"
    });
  }
};




// Re-apply for a course
reApplyRegistration = async (req, res) => {
  try {
    const { id } = req.params; // Original rejected registration ID
    const { notes } = req.body;

    const result = await this.registrationService.reApplyRegistration(id, notes);

    return sendResponse(req, res, {
      statusCode: 201,
      success: true,
      code: "REAPPLY_SUCCESS",
      message: "Application re-submitted successfully! Please wait for admin approval.",
      data: {
        newRegistration: result.newRegistration,
        reApplyCount: result.reApplyCount,
        originalRegistration: result.originalRegistration
      }
    });

  } catch (error) {
    console.error('Re-Apply Registration Error:', error);
    return sendResponse(req, res, {
      statusCode: error.message.includes("not found") ? 404 : 
                  error.message.includes("Only rejected") ? 400 : 
                  error.message.includes("exceeded") ? 400 : 500,
      success: false,
      code: "REAPPLY_ERROR",
      message: error.message || "Failed to re-apply"
    });
  }
};

// Get reapply history for a user
getReapplyHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "MISSING_USER_ID",
        message: "User ID is required"
      });
    }

    const history = await this.registrationService.getReapplyHistory(userId);

    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "SUCCESS",
      message: "Reapply history retrieved successfully",
      data: history
    });

  } catch (error) {
    console.error('Get Reapply History Error:', error);
    return sendResponse(req, res, {
      statusCode: 500,
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to fetch reapply history"
    });
  }
};

// Get registration with reapply info
getRegistrationWithReapplyInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await this.registrationService.getRegistrationWithReapplyInfo(id);

    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "SUCCESS",
      message: "Registration details retrieved successfully",
      data: registration
    });

  } catch (error) {
    console.error('Get Registration With Reapply Info Error:', error);
    return sendResponse(req, res, {
      statusCode: 404,
      success: false,
      code: "NOT_FOUND",
      message: error.message || "Registration not found"
    });
  }
};
}

module.exports = RegistrationController;