const { sendResponse } = require("../../helper/responseHelper");

class CourseController {
  constructor(courseService) {
    this.courseService = courseService;
    
    this.createCourse = this.createCourse.bind(this);
    this.getAllCourses = this.getAllCourses.bind(this);
    this.getCourseById = this.getCourseById.bind(this);
    this.getCourseBySlug = this.getCourseBySlug.bind(this);
    this.updateCourse = this.updateCourse.bind(this);
    this.deleteCourse = this.deleteCourse.bind(this);
    this.getCourseStats = this.getCourseStats.bind(this);
  }

  createCourse = async (req, res) => {
    try {
      const { 
        name, category, icon, duration, originalFee,  discountedFee,  description, 
        prerequisites, outline, features, schedule, isActive, order,

        tempImageIds 
      } = req.body;

      // Validate required fields
      const requiredFields = ['name', 'category', 'duration', 'originalFee', 'discountedFee', 'description'];
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

      const courseData = {
        name, category, icon, duration, originalFee, discountedFee, description,
        prerequisites, outline: outline || [], features: features || [],
        schedule, isActive: isActive !== undefined ? isActive : true, order: order || 0
      };

      const { course, images } = await this.courseService.createCourse(
        courseData, 
        tempImageIds || []
      );

      return sendResponse(req, res, {
        statusCode: 201,
        success: true,
        code: "COURSE_CREATED",
        message: "Course created successfully",
        data: {
          course,
          images
        }
      });
    } catch (error) {
      console.error('Create course error:', error);
      return sendResponse(req, res, {
        statusCode: 400,
        success: false,
        code: "COURSE_CREATION_FAILED",
        message: error.message
      });
    }
  };

  getAllCourses = async (req, res) => {
    try {
      const { category, isActive, search } = req.query;
      const courses = await this.courseService.getAllCourses({ category, isActive, search });
      
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "COURSES_FETCHED",
        message: "Courses retrieved successfully",
        data: courses,
        meta: {
          total: courses.length,
          filters: { category, isActive, search }
        }
      });
    } catch (error) {
      console.error('Get courses error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "FETCH_COURSES_FAILED",
        message: error.message
      });
    }
  };

  getCourseById = async (req, res) => {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "COURSE_FETCHED",
        message: "Course retrieved successfully",
        data: course
      });
    } catch (error) {
      console.error('Get course by id error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "COURSE_NOT_FOUND",
        message: error.message
      });
    }
  };

  getCourseBySlug = async (req, res) => {
    try {
      const { slug } = req.params;
      const course = await this.courseService.getCourseBySlug(slug);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "COURSE_FETCHED",
        message: "Course retrieved successfully",
        data: course
      });
    } catch (error) {
      console.error('Get course by slug error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "COURSE_NOT_FOUND",
        message: error.message
      });
    }
  };

updateCourse = async (req, res) => {
  try {
    const { 
      tempImageIds, 
      removeImageIds, 
      name, category, icon, duration, 
      originalFee, discountedFee, description,
      prerequisites, outline, features, schedule, 
      isActive, order,
      ...otherData 
    } = req.body;

    // Build updateData with only provided fields
    const updateData = { ...otherData };
    
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (icon !== undefined) updateData.icon = icon;
    if (duration !== undefined) updateData.duration = duration;
    if (originalFee !== undefined) updateData.originalFee = originalFee;
    if (discountedFee !== undefined) updateData.discountedFee = discountedFee;
    if (description !== undefined) updateData.description = description;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (outline !== undefined) updateData.outline = outline;
    if (features !== undefined) updateData.features = features;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const { course, images } = await this.courseService.updateCourse(
      req.params.id, 
      updateData, 
      tempImageIds || [], 
      removeImageIds || []
    );
    
    return sendResponse(req, res, {
      statusCode: 200,
      success: true,
      code: "COURSE_UPDATED",
      message: "Course updated successfully",
      data: { course, images }
    });
  } catch (error) {
    console.error('Update course error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return sendResponse(req, res, {
      statusCode,
      success: false,
      code: "COURSE_UPDATE_FAILED",
      message: error.message
    });
  }
};

  deleteCourse = async (req, res) => {
    try {
      const result = await this.courseService.deleteCourse(req.params.id);
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "COURSE_DELETED",
        message: result.message
      });
    } catch (error) {
      console.error('Delete course error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "COURSE_DELETE_FAILED",
        message: error.message
      });
    }
  };

  getCourseStats = async (req, res) => {
    try {
      const stats = await this.courseService.getCourseStats();
      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "COURSE_STATS_FETCHED",
        message: "Course statistics retrieved successfully",
        data: stats
      });
    } catch (error) {
      console.error('Get course stats error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "FETCH_COURSE_STATS_FAILED",
        message: error.message
      });
    }
  };
}

module.exports = CourseController;