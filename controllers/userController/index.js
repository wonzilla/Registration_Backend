const { sendResponse } = require("../../helper/responseHelper");

class UserController {
  constructor(userService) {
    this.userService = userService;
    
    // Bind all methods to the instance
    this.uploadImages = this.uploadImages.bind(this);
    this.signup = this.signup.bind(this);
    this.signin = this.signin.bind(this);
    this.adminLogin = this.adminLogin.bind(this);
    this.authWithGoogle = this.authWithGoogle.bind(this);
    this.resendOTP = this.resendOTP.bind(this);
    this.verifyOTP = this.verifyOTP.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.getUserCount = this.getUserCount.bind(this);
    this.deleteImage = this.deleteImage.bind(this);
    this.requestPasswordReset = this.requestPasswordReset.bind(this);
    this.verifyResetOTP = this.verifyResetOTP.bind(this);
    this.updatePasswordWithReset = this.updatePasswordWithReset.bind(this);
    this.checkCredentialsForEmailChange = this.checkCredentialsForEmailChange.bind(this);
    this.verifyOTPForEmailChange = this.verifyOTPForEmailChange.bind(this);
    this.sendNewEmailOTP = this.sendNewEmailOTP.bind(this);
    this.updateEmail = this.updateEmail.bind(this);
  }

  uploadImages = async (req, res) => {
    try {
      const images = await this.userService.uploadImages(req.files);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "UPLOAD_SUCCESS",
        message: "Images uploaded successfully",
        data: images
      });
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "UPLOAD_ERROR",
        message: error.message || "Image upload failed"
      });
    }
  };

  signup = async (req, res) => {
    try {
      const result = await this.userService.createUser(req.body);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "SIGNUP_SUCCESS",
        message: "User Registered Successfully",
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "SIGNUP_FAILED",
        message: error.message
      });
    }
  };

signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await this.userService.authenticateUser(email, password);
    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "OTP_SENT",
      message: result.msg,
      data: { email: result.email }
    });
  } catch (error) {
    console.error(error);
    return sendResponse(req, res, {
      statusCode: 400,
      success: false,
      code: "SIGNIN_FAILED",
      message: error.message
    });
  }
};




  // In UserController
adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await this.userService.adminLogin(email, password);
    
    // Set cookies
    res.cookie("accessToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
       maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: "none",
    });
    
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "none",
    });
    
    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "ADMIN_LOGIN_SUCCESS",
      message: result.msg,
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (error) {
    console.error(error);
    return sendResponse(req, res, {
      statusCode: 401,
      success: false,
      code: "ADMIN_LOGIN_FAILED",
      message: error.message
    });
  }
};

  authWithGoogle = async (req, res) => {
    try {
      const result = await this.userService.googleAuth(req.body);

       // Set cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
     maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: "none",
    });
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "none",
    });

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "GOOGLE_AUTH_SUCCESS",
        message: result.msg,
        data: {
          user: result.user,
          accessToken : result.accessToken ,
          refreshToken : result.refreshToken 
        }
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "GOOGLE_AUTH_FAILED",
        message: error.message
      });
    }
  };

  resendOTP = async (req, res) => {
    try {
      const { email } = req.body;
      const result = await this.userService.resendOTP(email);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "OTP_RESENT",
        message: result.msg,
        data: { email: result.email }
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "RESEND_OTP_FAILED",
        message: error.message
      });
    }
  };

verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await this.userService.verifyOTP(email, otp);
    
    // Set cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: "none",
    });
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "none",
    });

    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "OTP_VERIFIED",
      message: result.msg,
      data: {
        user: result.user,
        token: result.accessToken
      }
    });
  } catch (error) {
    console.error(error);
    return sendResponse(req, res, {
      statusCode: 400,
      success: false,
      code: "OTP_VERIFICATION_FAILED",
      message: error.message
    });
  }
};

  updateUser = async (req, res) => {
    try {
      const result = await this.userService.updateUser(req.params.id, req.body);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "USER_UPDATED",
        message: result.msg,
        data: { user: result.user }
      });
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "USER_UPDATE_FAILED",
        message: error.message
      });
    }
  };

  changePassword = async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await this.userService.changePassword(req.params.id, oldPassword, newPassword);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "PASSWORD_CHANGED",
        message: result.msg
      });
    } catch (error) {
      console.error("Password change error:", error);
      const statusCode = error.message.includes('required') ? 400 : 
                        error.message.includes('incorrect') ? 401 : 
                        error.message.includes('not found') ? 404 : 500;
      return sendResponse(req, res, {
        statusCode,
        success: false,
        code: "PASSWORD_CHANGE_FAILED",
        message: error.message
      });
    }
  };

  getUserById = async (req, res) => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "USER_FETCHED",
        message: "User retrieved successfully",
        data: user
      });
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "USER_NOT_FOUND",
        message: error.message
      });
    }
  };

  getAllUsers = async (req, res) => {
    try {
      const users = await this.userService.getAllUsers();
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "USERS_FETCHED",
        message: "Users retrieved successfully",
        data: users,
        meta: {
          count: users.length
        }
      });
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "FETCH_USERS_FAILED",
        message: error.message
      });
    }
  };

  deleteUser = async (req, res) => {
    try {
      const result = await this.userService.deleteUser(req.params.id);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "USER_DELETED",
        message: result.message
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "USER_DELETE_FAILED",
        message: error.message
      });
    }
  };

  getUserCount = async (req, res) => {
    try {
      const userCount = await this.userService.getUserCount();
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "USER_COUNT_FETCHED",
        message: "User count retrieved successfully",
        data: { count: userCount }
      });
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "FETCH_USER_COUNT_FAILED",
        message: error.message
      });
    }
  };

  deleteImage = async (req, res) => {
    try {
      const response = await this.userService.deleteCloudinaryImage(req.query.img);
      if (response) {
        return sendResponse(req, res, {
          statusCode: 200,
          success: true,
          code: "IMAGE_DELETED",
          message: "Image deleted successfully",
          data: response
        });
      }
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "IMAGE_DELETE_FAILED",
        message: error.message
      });
    }
  };

  requestPasswordReset = async (req, res) => {
    try {
      const { email } = req.body;
      const result = await this.userService.requestPasswordReset(email);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "RESET_OTP_SENT",
        message: result.msg,
        data: { email: result.email }
      });
    } catch (error) {
      console.error("Reset password error:", error);
      const statusCode = error.message === 'Email is required' ? 400 : 
                        error.message === 'User not found' ? 404 : 500;
      return sendResponse(req, res, {
        statusCode,
        success: false,
        code: "RESET_PASSWORD_FAILED",
        message: error.message
      });
    }
  };

  verifyResetOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
      const result = this.userService.verifyResetOTP(email, otp);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "RESET_OTP_VERIFIED",
        message: result.msg
      });
    } catch (error) {
      const statusCode = error.message.includes('expired') ? 400 : 
                        error.message.includes('Invalid') ? 401 : 500;
      return sendResponse(req, res, {
        statusCode,
        success: false,
        code: "RESET_OTP_VERIFICATION_FAILED",
        message: error.message
      });
    }
  };

  updatePasswordWithReset = async (req, res) => {
    try {
      const { email, newPassword, otp } = req.body;
      const result = await this.userService.updatePasswordWithReset(email, newPassword, otp);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "PASSWORD_RESET_SUCCESS",
        message: result.msg
      });
    } catch (error) {
      console.error('Password reset error:', error);
      const statusCode = error.message.includes('length') ? 400 : 
                        error.message.includes('expired') ? 400 : 500;
      return sendResponse(req, res, {
        statusCode,
        success: false,
        code: "PASSWORD_RESET_FAILED",
        message: error.message
      });
    }
  };

  checkCredentialsForEmailChange = async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await this.userService.checkCredentialsForEmailChange(email, password);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "CREDENTIALS_VERIFIED",
        message: result.msg
      });
    } catch (error) {
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "CREDENTIALS_VERIFICATION_FAILED",
        message: error.message
      });
    }
  };

  verifyOTPForEmailChange = async (req, res) => {
    try {
      const { email, otp } = req.body;
      const result = await this.userService.verifyOTPForEmailChange(email, otp);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "EMAIL_CHANGE_OTP_VERIFIED",
        message: result.msg
      });
    } catch (error) {
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "EMAIL_CHANGE_OTP_VERIFICATION_FAILED",
        message: error.message
      });
    }
  };

  sendNewEmailOTP = async (req, res) => {
    try {
      const { email, newEmail } = req.body;
      const result = await this.userService.sendNewEmailOTP(email, newEmail);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "NEW_EMAIL_OTP_SENT",
        message: result.msg
      });
    } catch (error) {
      console.log(error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "NEW_EMAIL_OTP_SEND_FAILED",
        message: error.message
      });
    }
  };

  updateEmail = async (req, res) => {
    try {
      const { email, otp, newEmail } = req.body;
      const result = await this.userService.updateEmail(email, otp, newEmail);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "EMAIL_UPDATED",
        message: result.msg
      });
    } catch (error) {
      console.log(error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "EMAIL_UPDATE_FAILED",
        message: error.message
      });
    }
  };
}

module.exports = UserController;