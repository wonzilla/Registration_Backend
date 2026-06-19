const express = require("express");
const router = express.Router();

module.exports = (controllers, middlewares) => {
    const {authMiddleware} = middlewares;
  const authenticate = authMiddleware.authenticate;
  const { registrationController } = controllers;

  router.use(authenticate)
  
  router.post("/", registrationController.createRegistration);
  router.get("/my/:userId", registrationController.getMyRegistrations);
  router.get("/my-courses/:userId", registrationController.getMyRegisteredCourses);


   router.get("/my-reapply/:userId", registrationController.getReapplyHistory);
  router.post("/reapply/:id", registrationController.reApplyRegistration);
  router.get("/reapply-info/:id", registrationController.getRegistrationWithReapplyInfo);
  return router;
};