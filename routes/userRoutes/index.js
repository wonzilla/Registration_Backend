const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

module.exports = (controllers , middlewares)=>{
 const {authMiddleware} = middlewares;
  const authenticate = authMiddleware.authenticate;
    const {userController} = controllers;
// ==================== IMAGE UPLOAD ROUTES ====================
router.post('/upload', upload.array("images"), userController.uploadImages);
router.delete('/deleteImage', userController.deleteImage);

// ==================== AUTHENTICATION ROUTES ====================
router.post('/signup', userController.signup);
router.post('/signin', userController.signin);
router.post('/authWithGoogle', userController.authWithGoogle);
router.post('/verify-otp', userController.verifyOTP);
router.post('/resend-otp', userController.resendOTP);

// ==================== PASSWORD MANAGEMENT ====================
router.post('/reset-password/request', userController.requestPasswordReset);
router.post('/reset-password/verify', userController.verifyResetOTP);
router.put('/reset-password/update', userController.updatePasswordWithReset);
router.put('/change-password/:id', userController.changePassword);

router.post('/admin/login', userController.adminLogin);

router.use(authenticate);


// ==================== USER MANAGEMENT ====================
router.get('/', userController.getAllUsers);
router.get('/get/count', userController.getUserCount);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);


// ==================== EMAIL CHANGE ROUTES ====================
router.post('/check-credentials', userController.checkCredentialsForEmailChange);
router.post('/verify-otp-change-email', userController.verifyOTPForEmailChange);
router.post('/send-new-email-otp', userController.sendNewEmailOTP);
router.post('/update-email', userController.updateEmail);


return router;
}
