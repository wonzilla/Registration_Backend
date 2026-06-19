const { Op } = require("sequelize");
const { v4: uuidv4 } = require('uuid');

class VisitorService {
  constructor(models) {
    this.models = models;
    this.Visitor = models.Visitor;
    this.VisitorAction = models.VisitorAction;
    this.Course = models.Course;
    this.User = models.User;
  }

  // Track or create visitor
async trackVisitor(sessionId, visitorData) {
  try {
    // Validate sessionId
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Try to find existing visitor
    let visitor = await this.Visitor.findOne({ 
      where: { sessionId: sessionId } 
    });

    if (visitor) {
      // Update existing visitor
      visitor.lastActivity = new Date();
      visitor.visitCount = (visitor.visitCount || 0) + 1;
      visitor.userAgent = visitorData.userAgent || visitor.userAgent;
      visitor.ipAddress = visitorData.ipAddress || visitor.ipAddress;
      visitor.deviceType = visitorData.deviceType || visitor.deviceType || 'unknown';
      visitor.browser = visitorData.browser || visitor.browser;
      visitor.os = visitorData.os || visitor.os;
      visitor.referrer = visitorData.referrer || visitor.referrer;
      visitor.landingPage = visitorData.landingPage || visitor.landingPage;
      
      await visitor.save();
      return visitor;
    } else {
      // Create new visitor with upsert to handle race conditions
      try {
        visitor = await this.Visitor.create({
          sessionId: sessionId,
          userAgent: visitorData.userAgent || null,
          ipAddress: visitorData.ipAddress || null,
          deviceType: visitorData.deviceType || 'unknown',
          browser: visitorData.browser || null,
          os: visitorData.os || null,
          referrer: visitorData.referrer || null,
          landingPage: visitorData.landingPage || null,
          firstVisit: new Date(),
          lastActivity: new Date(),
          visitCount: 1,
          isLoggedIn: false,
        });
        return visitor;
      } catch (createError) {
        // If duplicate entry error, try to find again (race condition)
        if (createError.name === 'SequelizeUniqueConstraintError') {
          const existingVisitor = await this.Visitor.findOne({ 
            where: { sessionId: sessionId } 
          });
          if (existingVisitor) {
            // Update the existing visitor
            existingVisitor.lastActivity = new Date();
            existingVisitor.visitCount = (existingVisitor.visitCount || 0) + 1;
            await existingVisitor.save();
            return existingVisitor;
          }
        }
        throw createError;
      }
    }
  } catch (error) {
    console.error('Track Visitor Error:', error);
    throw error;
  }
}

  // Associate user with visitor
  async associateUserWithVisitor(sessionId, userId) {
    try {
      const visitor = await this.Visitor.findOne({ where: { sessionId } });
      if (!visitor) {
        throw new Error('Visitor not found');
      }

      visitor.userId = userId;
      visitor.isLoggedIn = true;
      await visitor.save();

      return visitor;
    } catch (error) {
      console.error('Associate User With Visitor Error:', error);
      throw error;
    }
  }

  // Track visitor action
  async trackAction(sessionId, actionData) {
    try {
      const { actionType, userId, courseId, registrationId, metadata } = actionData;

      const action = await this.VisitorAction.create({
        sessionId,
        userId: userId || null,
        actionType,
        courseId: courseId || null,
        registrationId: registrationId || null,
        metadata: metadata || {},
        ipAddress: actionData.ipAddress,
        userAgent: actionData.userAgent,
      });

      // Update visitor last activity
      await this.Visitor.update(
        { lastActivity: new Date() },
        { where: { sessionId } }
      );

      return action;
    } catch (error) {
      console.error('Track Action Error:', error);
      throw error;
    }
  }

  // Get visitor analytics
async getAnalytics(filters = {}) {
  try {
    const { startDate, endDate } = filters;
    const where = {};

    if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { [Op.lte]: new Date(endDate) };
    }

    // ============ SUMMARY STATS ============
    const [totalVisitors, uniqueVisitors, loggedInVisitors] = await Promise.all([
      this.Visitor.count(),
      this.Visitor.count({ distinct: true, col: 'sessionId' }),
      this.Visitor.count({ where: { isLoggedIn: true } }),
    ]);

    // ============ ACTION STATS ============
    const actionStats = await this.VisitorAction.findAll({
      attributes: [
        'actionType',
        [this.VisitorAction.sequelize.fn('COUNT', this.VisitorAction.sequelize.col('actionType')), 'count'],
      ],
      where: {
        ...where,
        actionType: {
          [Op.ne]: '' // Exclude empty action types
        }
      },
      group: ['actionType'],
      raw: true,
    });

    // ============ PER COURSE DETAILED ANALYTICS ============
    const allCourses = await this.Course.findAll({
      attributes: ['id', 'name', 'category'],
      where: { isActive: true },
      raw: true,
    });

    const courseAnalytics = [];
    
    for (const course of allCourses) {
      const courseWhere = {
        courseId: course.id,
        ...where,
      };

      // Get all actions for this course
      const [courseClicks, registerClicks, registrations] = await Promise.all([
        this.VisitorAction.count({
          where: {
            actionType: 'course_click',
            ...courseWhere,
          },
        }),
        this.VisitorAction.count({
          where: {
            actionType: 'course_register_click',
            ...courseWhere,
          },
        }),
        this.VisitorAction.count({
          where: {
            actionType: 'registration_submit',
            ...courseWhere,
          },
        }),
      ]);

      // Get unique users who registered
      const uniqueUsersResult = await this.VisitorAction.findAll({
        attributes: [
          [this.VisitorAction.sequelize.fn('DISTINCT', this.VisitorAction.sequelize.col('userId')), 'userId'],
        ],
        where: {
          actionType: 'registration_submit',
          ...courseWhere,
          userId: { [Op.ne]: null } // Only get users with userId
        },
        raw: true,
      });

      // Get registration details with user info - FIXED
      const registrationDetails = await this.VisitorAction.findAll({
        attributes: [
          'userId',
          'metadata',
          'createdAt',
        ],
        where: {
          actionType: 'registration_submit',
          ...courseWhere,
        },
        include: [
          {
            model: this.User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      // Calculate conversion rates
      const clickToRegisterRate = courseClicks > 0 
        ? ((registerClicks / courseClicks) * 100).toFixed(2) 
        : 0;
      
      const registerToCompleteRate = registerClicks > 0 
        ? ((registrations / registerClicks) * 100).toFixed(2) 
        : 0;

      // Get registration timeline
      const registrationTimeline = await this.VisitorAction.findAll({
        attributes: [
          [this.VisitorAction.sequelize.fn('DATE', this.VisitorAction.sequelize.col('createdAt')), 'date'],
          [this.VisitorAction.sequelize.fn('COUNT', this.VisitorAction.sequelize.col('id')), 'count'],
        ],
        where: {
          actionType: 'registration_submit',
          ...courseWhere,
        },
        group: [this.VisitorAction.sequelize.fn('DATE', this.VisitorAction.sequelize.col('createdAt'))],
        order: [[this.VisitorAction.sequelize.fn('DATE', this.VisitorAction.sequelize.col('createdAt')), 'ASC']],
        limit: 30,
        raw: true,
      });

      courseAnalytics.push({
        courseId: course.id,
        courseName: course.name,
        courseCategory: course.category,
        metrics: {
          courseClicks: parseInt(courseClicks),
          registerClicks: parseInt(registerClicks),
          registrations: parseInt(registrations),
          uniqueUsers: uniqueUsersResult.length,
          clickToRegisterRate: parseFloat(clickToRegisterRate),
          registerToCompleteRate: parseFloat(registerToCompleteRate),
        },
        recentRegistrations: registrationDetails.map(reg => ({
          userId: reg.userId || reg.user?.id,
          userName: reg.user?.name || 'Unknown',
          userEmail: reg.user?.email || 'Unknown',
          registrationNumber: reg.metadata?.registrationNumber || 'N/A',
          registeredAt: reg.createdAt,
        })),
        registrationTimeline: registrationTimeline.map(item => ({
          date: item.date,
          registrations: parseInt(item.count),
        })),
      });
    }

    // Sort courses by registrations
    courseAnalytics.sort((a, b) => b.metrics.registrations - a.metrics.registrations);

    // ============ TOP COURSES (Only top 5) ============
    const topCourses = courseAnalytics
      .filter(c => c.metrics.courseClicks > 0 || c.metrics.registrations > 0)
      .slice(0, 5);

    // ============ REGISTRATION CONVERSION SUMMARY ============
    const totalRegisterClicks = courseAnalytics.reduce((sum, c) => sum + c.metrics.registerClicks, 0);
    const totalRegistrations = courseAnalytics.reduce((sum, c) => sum + c.metrics.registrations, 0);

    // ============ DAILY TREND ============
    const dailyTrend = await this.Visitor.findAll({
      attributes: [
        [this.Visitor.sequelize.fn('DATE', this.Visitor.sequelize.col('Visitor.createdAt')), 'date'],
        [this.Visitor.sequelize.fn('COUNT', this.Visitor.sequelize.col('Visitor.id')), 'count'],
      ],
      where,
      group: [this.Visitor.sequelize.fn('DATE', this.Visitor.sequelize.col('Visitor.createdAt'))],
      order: [[this.Visitor.sequelize.fn('DATE', this.Visitor.sequelize.col('Visitor.createdAt')), 'ASC']],
      limit: 30,
      raw: true,
    });

    // ============ USER REGISTRATION ACTIVITY ============
    const userRegistrationActivity = await this.VisitorAction.findAll({
      attributes: [
        'userId',
        [this.VisitorAction.sequelize.fn('COUNT', this.VisitorAction.sequelize.col('userId')), 'registrations'],
      ],
      where: {
        actionType: 'registration_submit',
        ...where,
        userId: { [Op.ne]: null } // Only get users with userId
      },
      include: [
        {
          model: this.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      group: ['userId'],
      order: [[this.VisitorAction.sequelize.fn('COUNT', this.VisitorAction.sequelize.col('userId')), 'DESC']],
      limit: 20,
    });

    return {
      summary: {
        totalVisitors,
        uniqueVisitors,
        loggedInVisitors,
        conversionRate: totalVisitors > 0 ? ((loggedInVisitors / totalVisitors) * 100).toFixed(2) : 0,
        totalRegistrations,
        totalRegisterClicks,
        overallConversionRate: totalRegisterClicks > 0 
          ? ((totalRegistrations / totalRegisterClicks) * 100).toFixed(2) 
          : 0,
      },
      actions: actionStats.map(stat => ({
        actionType: stat.actionType,
        count: parseInt(stat.count),
      })),
      courseAnalytics,
      topCourses,
      registrationConversion: {
        registerClicks: totalRegisterClicks,
        actualRegistrations: totalRegistrations,
        conversionRate: totalRegisterClicks > 0 
          ? ((totalRegistrations / totalRegisterClicks) * 100).toFixed(2) 
          : 0,
      },
      userRegistrationActivity: userRegistrationActivity.map(item => ({
        userId: item.userId || item.user?.id,
        userName: item.user?.name || 'Unknown',
        userEmail: item.user?.email || 'Unknown',
        registrations: parseInt(item.dataValues.registrations),
      })),
      dailyTrend: dailyTrend.map(day => ({
        date: day.date,
        visitors: parseInt(day.count),
      })),
    };
  } catch (error) {
    console.error('Get Analytics Error:', error);
    throw error;
  }
}

  // Get visitor by session
  async getVisitorBySession(sessionId) {
    try {
      const visitor = await this.Visitor.findOne({
        where: { sessionId },
        include: [
          {
            model: this.VisitorAction,
            as: 'actions',
            limit: 50,
            order: [['createdAt', 'DESC']],
          },
          {
            model: this.User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });
      return visitor;
    } catch (error) {
      console.error('Get Visitor By Session Error:', error);
      throw error;
    }
  }

  // Get user's visit history
  async getUserVisitHistory(userId) {
    try {
      const visits = await this.Visitor.findAll({
        where: { userId },
        include: [
          {
            model: this.VisitorAction,
            as: 'actions',
            limit: 20,
            order: [['createdAt', 'DESC']],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
      return visits;
    } catch (error) {
      console.error('Get User Visit History Error:', error);
      throw error;
    }
  }

  // Get course registration stats
  async getCourseRegistrationStats(courseId) {
    try {
      const courseClicks = await this.VisitorAction.count({
        where: {
          courseId,
          actionType: 'course_click',
        },
      });

      const registerClicks = await this.VisitorAction.count({
        where: {
          courseId,
          actionType: 'course_register_click',
        },
      });

      const registrations = await this.VisitorAction.count({
        where: {
          courseId,
          actionType: 'registration_submit',
        },
      });

      return {
        courseId,
        courseClicks,
        registerClicks,
        registrations,
        clickToRegisterRate: courseClicks > 0 ? ((registerClicks / courseClicks) * 100).toFixed(2) : 0,
        registerToCompleteRate: registerClicks > 0 ? ((registrations / registerClicks) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      console.error('Get Course Registration Stats Error:', error);
      throw error;
    }
  }
}

module.exports = VisitorService;