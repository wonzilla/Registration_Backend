const express = require('express');
const router = express.Router();

module.exports = (controllers , middlewares) => {
  const {authMiddleware} = middlewares;
  const authenticate = authMiddleware.authenticate;
    const {courseController} = controllers
  // Public routes
  router.get('/', courseController.getAllCourses);
  router.get('/stats', courseController.getCourseStats);
  router.get('/:id', courseController.getCourseById);
  router.get('/slug/:slug', courseController.getCourseBySlug);
  // Admin routes

  router.use(authenticate)
  router.post('/', courseController.createCourse);
  router.put('/:id', courseController.updateCourse);
  router.delete('/:id', courseController.deleteCourse);
  
  return router;
};