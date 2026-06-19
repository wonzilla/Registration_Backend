const express = require("express");
const router = express.Router();

module.exports = (controllers , authenticate) => {
  const { registrationController } = controllers;



  // ============ ADMIN ROUTES ============
  // Get all registrations

  router.use(authenticate)
  router.get("/", registrationController.getAllRegistrations);
  router.get("/all", registrationController.getAllRegistrationsFull);
  router.get("/stats", registrationController.getRegistrationStats);
  router.get("/:id", registrationController.getRegistrationById);
  router.get("/review-payments", registrationController.getReviewPaymentRegistrations);
  // Update registration status (Approve/Reject)
  router.put("/:id/status", registrationController.updateRegistrationStatus);
  
  // Process payment (After approval)
  router.put("/:id/payment", registrationController.processPayment);
   router.put("/:id/payment-status", registrationController.updatePaymentStatus);
  // Delete registration
  router.delete("/:id", registrationController.deleteRegistration);
  
  return router;
};