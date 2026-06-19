const express = require("express");
const router = express.Router();

module.exports = (controllers, middlewares) => {
      const {authMiddleware} = middlewares;
  const authenticate = authMiddleware.authenticate;
  const isAdmin = authMiddleware.isAdmin;


  const { visitorController } = controllers;

  // Public routes (no auth required)
  router.post("/track", visitorController.trackVisitor);
  router.post("/action", visitorController.trackAction);

  // Protected routes (admin only)
  router.get("/analytics", authenticate, isAdmin, visitorController.getAnalytics);
  router.get("/session/:sessionId", authenticate, isAdmin, visitorController.getVisitorBySession);
  router.get("/user/:userId/history", authenticate, isAdmin, visitorController.getUserVisitHistory);
  router.get("/course/:courseId/stats", authenticate, isAdmin, visitorController.getCourseRegistrationStats);

  // Associate user with visitor (authenticated)
  router.post("/associate", authenticate, visitorController.associateUser);

  return router;
};