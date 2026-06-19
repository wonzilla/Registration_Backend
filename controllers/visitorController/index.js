const { sendResponse } = require("../../helper/responseHelper");

class VisitorController {
  constructor(visitorService) {
    this.visitorService = visitorService;
  }

  // Track visitor (public)
  trackVisitor = async (req, res) => {
    try {
      const { sessionId } = req.body;
      const visitorData = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceType: req.body.deviceType,
        browser: req.body.browser,
        os: req.body.os,
        referrer: req.headers.referer,
        landingPage: req.body.landingPage,
      };

      const visitor = await this.visitorService.trackVisitor(sessionId, visitorData);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "VISITOR_TRACKED",
        message: "Visitor tracked successfully",
        data: visitor,
      });
    } catch (error) {
      console.error('Track Visitor Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "TRACK_VISITOR_ERROR",
        message: error.message || "Failed to track visitor",
      });
    }
  };

  // Track action (public)
  trackAction = async (req, res) => {
    try {
      const { sessionId, actionType, userId, courseId, registrationId, metadata } = req.body;

      const actionData = {
        sessionId,
        actionType,
        userId: userId || null,
        courseId,
        registrationId,
        metadata,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const action = await this.visitorService.trackAction(sessionId, actionData);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "ACTION_TRACKED",
        message: "Action tracked successfully",
        data: action,
      });
    } catch (error) {
      console.error('Track Action Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "TRACK_ACTION_ERROR",
        message: error.message || "Failed to track action",
      });
    }
  };

  // Associate user with visitor (called on login)
  associateUser = async (req, res) => {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return sendResponse(req, res, {
          statusCode: 401,
          success: false,
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const visitor = await this.visitorService.associateUserWithVisitor(sessionId, userId);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "USER_ASSOCIATED",
        message: "User associated with visitor successfully",
        data: visitor,
      });
    } catch (error) {
      console.error('Associate User Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "ASSOCIATE_USER_ERROR",
        message: error.message || "Failed to associate user",
      });
    }
  };

  // Get analytics (admin)
  getAnalytics = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const analytics = await this.visitorService.getAnalytics({ startDate, endDate });

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "ANALYTICS_FETCHED",
        message: "Analytics fetched successfully",
        data: analytics,
      });
    } catch (error) {
      console.error('Get Analytics Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "GET_ANALYTICS_ERROR",
        message: error.message || "Failed to fetch analytics",
      });
    }
  };

  // Get visitor by session
  getVisitorBySession = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const visitor = await this.visitorService.getVisitorBySession(sessionId);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "VISITOR_FETCHED",
        message: "Visitor fetched successfully",
        data: visitor,
      });
    } catch (error) {
      console.error('Get Visitor By Session Error:', error);
      return sendResponse(req, res, {
        statusCode: 404,
        success: false,
        code: "VISITOR_NOT_FOUND",
        message: error.message || "Visitor not found",
      });
    }
  };

  // Get user visit history
  getUserVisitHistory = async (req, res) => {
    try {
      const { userId } = req.params;
      const history = await this.visitorService.getUserVisitHistory(userId);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "VISIT_HISTORY_FETCHED",
        message: "Visit history fetched successfully",
        data: history,
      });
    } catch (error) {
      console.error('Get User Visit History Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "GET_VISIT_HISTORY_ERROR",
        message: error.message || "Failed to fetch visit history",
      });
    }
  };

  // Get course registration stats
  getCourseRegistrationStats = async (req, res) => {
    try {
      const { courseId } = req.params;
      const stats = await this.visitorService.getCourseRegistrationStats(courseId);

      return sendResponse(req, res, {
        statusCode: 200,
        success: true,
        code: "COURSE_STATS_FETCHED",
        message: "Course stats fetched successfully",
        data: stats,
      });
    } catch (error) {
      console.error('Get Course Registration Stats Error:', error);
      return sendResponse(req, res, {
        statusCode: 500,
        success: false,
        code: "GET_COURSE_STATS_ERROR",
        message: error.message || "Failed to fetch course stats",
      });
    }
  };
}

module.exports = VisitorController;