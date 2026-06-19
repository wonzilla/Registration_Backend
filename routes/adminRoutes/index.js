// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

module.exports = (controllers  , middlewares) => {
  const {authMiddleware} = middlewares;
  const authenticate = authMiddleware.authenticate;
  const { registrationController } = controllers;
  
//  const authRoutes = require("./auth")
 const registrationRoutes = require("./registrations")(controllers, authenticate)


  // router.use("/auth" , authRoutes)
  router.use("/registrations" , registrationRoutes)

  return router;
};