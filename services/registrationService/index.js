const { Op } = require("sequelize");
const sendOTPEmail = require("../../helper/otpHelper");

class RegistrationService {
  constructor(models) {
    this.models = models;
    this.Registration = models.Registration;
    this.Media = models.Media;
    this.RegistrationPayment = models.RegistrationPayment;
    this.Course = models.Course;
    this.User = models.User;
  }

  // Create new registration WITHOUT payment
  async createRegistration(registrationData) {
    try {
      const { courseId, courseName, email, whatsappNumber, userId } = registrationData;

      // Check if email already registered
      const existingEmail = await this.Registration.findOne({
        where: {
          email: email.toLowerCase(),
          courseName,
          status: { [Op.not]: "rejected" }
        }
      });

      if (existingEmail) {
        throw new Error("This email is already registered for this course");
      }

      // Check if whatsapp already registered
      const existingWhatsapp = await this.Registration.findOne({
        where: {
          whatsappNumber,
          courseName,
          status: { [Op.not]: "rejected" }
        }
      });

      if (existingWhatsapp) {
        throw new Error("This WhatsApp number is already registered for this course");
      }

      // Get course details for fee information
      const course = await this.Course.findByPk(courseId);
      let originalFeeAmount = 0;
      let discountedFeeAmount = 0;

      if (course) {
        originalFeeAmount = parseFloat(course.originalFee) || 0;
        discountedFeeAmount = parseFloat(course.discountedFee) || 0;
      }

      // Generate registration number
      const registrationNumber = await this.generateRegistrationNumber();
      
      const dataWithRegNumber = {
        ...registrationData,
        registrationNumber,
        originalFeeAmount,
        discountedFeeAmount,
        status: "pending",
        paymentStatus: "pending"
      };

      // Create registration without any payment
      const registration = await this.Registration.create(dataWithRegNumber);
      
   const mailOptions = {
  subject: '📝 Course Registration Confirmation - SM Academy',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f6f9fc;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .container {
          max-width: 560px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 40px 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 60%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          border-radius: 50%;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 40%;
          height: 80%;
          background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
          border-radius: 50%;
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
        }
        .logo span {
          background: linear-gradient(135deg, #667eea, #764ba2);
          padding: 2px 12px;
          border-radius: 8px;
          margin-left: 4px;
        }
        .logo-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 4px;
          position: relative;
          z-index: 1;
        }
        .content {
          padding: 40px 40px 30px;
        }
        .greeting {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .sub-greeting {
          color: #6b7280;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
          margin: 24px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 20px 0;
        }
        .info-item {
          background: #f8fafc;
          padding: 14px 16px;
          border-radius: 12px;
          text-align: center;
        }
        .info-item .label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .info-item .value {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a2e;
          margin-top: 4px;
        }
        .status-badge {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 16px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer-text {
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
          line-height: 1.8;
        }
        .footer-text strong {
          color: #6b7280;
        }
        .footer {
          background: #f8fafc;
          padding: 20px 40px;
          text-align: center;
          border-top: 1px solid rgba(0,0,0,0.04);
        }
        .footer p {
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.8;
        }
        .footer .brand {
          color: #667eea;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .container {
            margin: 16px;
            border-radius: 16px;
          }
          .header {
            padding: 30px 24px 24px;
          }
          .content {
            padding: 28px 24px 20px;
          }
          .greeting {
            font-size: 18px;
          }
          .footer {
            padding: 16px 24px;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            SM <span>Academy</span>
          </div>
          <div class="logo-sub">Secure · Trusted · Excellence</div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="greeting">
            🎉 Registration Confirmed!
          </div>
          <div class="sub-greeting">
            Dear <strong>${registrationData.fullName}</strong>,<br><br>
            Thank you for registering with SM Academy! Your course registration has been received successfully and is currently under review.
          </div>
          
          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Registration No.</div>
              <div class="value">${registrationNumber}</div>
            </div>
            <div class="info-item">
              <div class="label">Course Name</div>
              <div class="value">${courseName}</div>
            </div>
            <div class="info-item">
              <div class="label">Status</div>
              <div class="value"><span class="status-badge">Pending Review</span></div>
            </div>
            <div class="info-item">
              <div class="label">Registration Date</div>
              <div class="value">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer-text">
            <strong>What's Next?</strong><br>
            Our team will review your application and notify you of the status within 24-48 hours.<br><br>
            <strong>Need help?</strong> Contact us at <a href="mailto:support@smacademy.com" style="color: #667eea; text-decoration: none;">support@smacademy.com</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>
            &copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — 
            Empowering learning, one student at a time.
          </p>
          <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">
            This is an automated confirmation. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
};
      
          await sendOTPEmail(email, mailOptions);
      return registration;
    } catch (error) {
      console.error('Create Registration Error:', error);
      throw error;
    }
  }

  // Get user's own registrations
  async getMyRegistrations(userId, filters = {}) {
    try {
      const { status, courseName, search, page = 1, limit = 50 } = filters;
      const where = { userId };
      const offset = (parseInt(page) - 1) * parseInt(limit);

      if (status) where.status = status;
      if (courseName) where.courseName = courseName;

      if (search) {
        where[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { whatsappNumber: { [Op.like]: `%${search}%` } },
          { registrationNumber: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await this.Registration.findAndCountAll({
        where,
        include: [
          {
            model: this.Course,
            as: 'course',
            required: false,
          },
          {
            model: this.RegistrationPayment,
            as: 'payment',
            required: false,
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        registrations: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Get My Registrations Error:', error);
      throw error;
    }
  }


  // Get user's registered courses (simplified for course list)
async getMyRegisteredCourses(userId) {
  try {
    const registrations = await this.Registration.findAll({
      where: { userId },
      attributes: ['courseId', 'courseName', 'status', 'paymentStatus', 'id'],
      include: [
        {
          model: this.Course,
          as: 'course',
          required: false,
          attributes: ['id', 'name', 'category', 'icon', 'duration', 'originalFee', 'discountedFee']
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return registrations.map(reg => ({
      registrationId: reg.id,
      courseId: reg.courseId,
      courseName: reg.courseName,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      course: reg.course
    }));
  } catch (error) {
    console.error('Get My Registered Courses Error:', error);
    throw error;
  }
}

async updateRegistrationStatus(id, status, adminRemarks = null, email) {

  try {
    const registration = await this.Registration.findByPk(id);
    if (!registration) {
      throw new Error("Registration not found");
    }

    const updateData = { status, adminRemarks };

    // If approved, set approval date and payment deadline (3 days)
    if (status === 'approved') {
      updateData.approvedAt = new Date();
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      updateData.paymentDeadline = deadline;
    }

    await registration.update(updateData);

    
    // If approved, create a payment record
    if (status === 'approved') {
      await this.createPaymentRecord(registration);
    }

    // Determine recipient email
    const recipientEmail =registration.email;

    // Send email based on status
    if (status === 'approved') {
      const mailOptions = {
        subject: '✅ Registration Approved - SM Academy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Approved</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #f6f9fc;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              .container {
                max-width: 560px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                border: 1px solid rgba(0, 0, 0, 0.04);
              }
              .header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 40px 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 60%;
                height: 100%;
                background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
                border-radius: 50%;
              }
              .header::after {
                content: '';
                position: absolute;
                bottom: -30%;
                left: -10%;
                width: 40%;
                height: 80%;
                background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
                border-radius: 50%;
              }
              .logo {
                font-size: 28px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -0.5px;
                position: relative;
                z-index: 1;
              }
              .logo span {
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 2px 12px;
                border-radius: 8px;
                margin-left: 4px;
              }
              .logo-sub {
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                font-weight: 400;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-top: 4px;
                position: relative;
                z-index: 1;
              }
              .content {
                padding: 40px 40px 30px;
              }
              .greeting {
                font-size: 22px;
                font-weight: 700;
                color: #1a1a2e;
                margin-bottom: 8px;
              }
              .sub-greeting {
                color: #6b7280;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .badge {
                display: inline-block;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                font-size: 14px;
                font-weight: 600;
                padding: 6px 20px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 16px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 20px 0;
              }
              .info-item {
                background: #f8fafc;
                padding: 14px 16px;
                border-radius: 12px;
                text-align: center;
              }
              .info-item .label {
                font-size: 11px;
                color: #9ca3af;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
              }
              .info-item .value {
                font-size: 15px;
                font-weight: 600;
                color: #1a1a2e;
                margin-top: 4px;
              }
              .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
                margin: 24px 0;
              }
              .fee-info {
                background: linear-gradient(135deg, #eef2ff, #f8faff);
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                border: 1px solid rgba(102, 126, 234, 0.1);
              }
              .fee-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
              }
              .fee-row .label {
                color: #6b7280;
                font-size: 14px;
              }
              .fee-row .value {
                font-weight: 600;
                color: #1a1a2e;
                font-size: 14px;
              }
              .fee-row .discounted {
                color: #10b981;
              }
              .footer-text {
                text-align: center;
                color: #9ca3af;
                font-size: 13px;
                line-height: 1.8;
              }
              .footer-text strong {
                color: #6b7280;
              }
              .btn {
                display: inline-block;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                margin-top: 16px;
              }
              .footer {
                background: #f8fafc;
                padding: 20px 40px;
                text-align: center;
                border-top: 1px solid rgba(0,0,0,0.04);
              }
              .footer p {
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.8;
              }
              .footer .brand {
                color: #667eea;
                font-weight: 600;
              }
              @media (max-width: 600px) {
                .container { margin: 16px; border-radius: 16px; }
                .header { padding: 30px 24px 24px; }
                .content { padding: 28px 24px 20px; }
                .greeting { font-size: 18px; }
                .footer { padding: 16px 24px; }
                .info-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">SM <span>Academy</span></div>
                <div class="logo-sub">Secure · Trusted · Excellence</div>
              </div>
              
              <div class="content">
                <div class="badge">✅ Approved</div>
                <div class="greeting">🎉 Congratulations, ${registration.fullName}!</div>
                <div class="sub-greeting">
                  Your registration for <strong>${registration.courseName}</strong> has been <strong style="color: #10b981;">approved</strong> by our admin team.
                </div>
                
                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">Registration No.</div>
                    <div class="value">${registration.registrationNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Course</div>
                    <div class="value">${registration.courseName}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Status</div>
                    <div class="value"><span style="color: #10b981; font-weight: 700;">Approved</span></div>
                  </div>
                  <div class="info-item">
                    <div class="label">Deadline</div>
                    <div class="value">${new Date(registration.paymentDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>

                <div class="fee-info">
                  <div class="fee-row">
                    <span class="label">Original Fee</span>
                    <span class="value">Rs. ${registration.originalFeeAmount}</span>
                  </div>
                  <div class="fee-row">
                    <span class="label">Discounted Fee</span>
                    <span class="value discounted">Rs. ${registration.discountedFeeAmount}</span>
                  </div>
                  <div class="fee-row" style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 6px;">
                    <span class="label" style="font-weight: 600;">Amount to Pay</span>
                    <span class="value" style="font-size: 18px; color: #667eea;">Rs. ${registration.discountedFeeAmount}</span>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="footer-text">
                  <strong>⏰ Payment Required Within 3 Days</strong><br>
                  Please complete your payment of <strong>Rs. ${registration.discountedFeeAmount}</strong> before 
                  <strong>${new Date(registration.paymentDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong> 
                  to secure your seat. After this date, the discounted fee will no longer be available.<br><br>
                  <strong>Next Steps:</strong><br>
                  1️⃣ Login to your account<br>
                  2️⃣ Go to "My Registrations"<br>
                  3️⃣ Click "Pay Fee" and complete your payment<br><br>
                  <a href="${process.env.CLIENT_APP_URL}/my-registrations" class="btn">Pay Now →</a>
                </div>
                
                ${adminRemarks ? `
                  <div class="divider"></div>
                  <div class="footer-text" style="text-align: left; background: #f8fafc; padding: 16px; border-radius: 12px;">
                    <strong>Admin Remarks:</strong><br>
                    ${adminRemarks}
                  </div>
                ` : ''}
              </div>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — Empowering learning, one student at a time.</p>
                <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      await sendOTPEmail(recipientEmail, mailOptions);

      
    } else if (status === 'rejected') {
      const mailOptions = {
        subject: '❌ Registration Update - SM Academy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Update</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #f6f9fc;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              .container {
                max-width: 560px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                border: 1px solid rgba(0, 0, 0, 0.04);
              }
              .header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 40px 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 60%;
                height: 100%;
                background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
                border-radius: 50%;
              }
              .header::after {
                content: '';
                position: absolute;
                bottom: -30%;
                left: -10%;
                width: 40%;
                height: 80%;
                background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
                border-radius: 50%;
              }
              .logo {
                font-size: 28px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -0.5px;
                position: relative;
                z-index: 1;
              }
              .logo span {
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 2px 12px;
                border-radius: 8px;
                margin-left: 4px;
              }
              .logo-sub {
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                font-weight: 400;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-top: 4px;
                position: relative;
                z-index: 1;
              }
              .content {
                padding: 40px 40px 30px;
              }
              .greeting {
                font-size: 22px;
                font-weight: 700;
                color: #1a1a2e;
                margin-bottom: 8px;
              }
              .sub-greeting {
                color: #6b7280;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .badge {
                display: inline-block;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                font-size: 14px;
                font-weight: 600;
                padding: 6px 20px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 16px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 20px 0;
              }
              .info-item {
                background: #f8fafc;
                padding: 14px 16px;
                border-radius: 12px;
                text-align: center;
              }
              .info-item .label {
                font-size: 11px;
                color: #9ca3af;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
              }
              .info-item .value {
                font-size: 15px;
                font-weight: 600;
                color: #1a1a2e;
                margin-top: 4px;
              }
              .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
                margin: 24px 0;
              }
              .btn {
                display: inline-block;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                margin-top: 16px;
              }
              .btn-secondary {
                display: inline-block;
                background: transparent;
                color: #667eea;
                text-decoration: none;
                padding: 10px 28px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                margin-top: 10px;
                border: 2px solid #667eea;
              }
              .footer-text {
                text-align: center;
                color: #9ca3af;
                font-size: 13px;
                line-height: 1.8;
              }
              .footer-text strong {
                color: #6b7280;
              }
              .footer {
                background: #f8fafc;
                padding: 20px 40px;
                text-align: center;
                border-top: 1px solid rgba(0,0,0,0.04);
              }
              .footer p {
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.8;
              }
              .footer .brand {
                color: #667eea;
                font-weight: 600;
              }
              @media (max-width: 600px) {
                .container { margin: 16px; border-radius: 16px; }
                .header { padding: 30px 24px 24px; }
                .content { padding: 28px 24px 20px; }
                .greeting { font-size: 18px; }
                .footer { padding: 16px 24px; }
                .info-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">SM <span>Academy</span></div>
                <div class="logo-sub">Secure · Trusted · Excellence</div>
              </div>
              
              <div class="content">
                <div class="badge">❌ Not Approved</div>
                <div class="greeting">Dear ${registration.fullName},</div>
                <div class="sub-greeting">
                  We regret to inform you that your registration for <strong>${registration.courseName}</strong> has been <strong style="color: #ef4444;">rejected</strong>.
                </div>
                
                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">Registration No.</div>
                    <div class="value">${registration.registrationNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Course</div>
                    <div class="value">${registration.courseName}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Status</div>
                    <div class="value"><span style="color: #ef4444; font-weight: 700;">Rejected</span></div>
                  </div>
                  <div class="info-item">
                    <div class="label">Date</div>
                    <div class="value">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>

                ${adminRemarks ? `
                  <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #fecaca;">
                    <strong style="color: #dc2626;">Reason for Rejection:</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">${adminRemarks}</span>
                  </div>
                ` : `
                  <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #fecaca;">
                    <strong style="color: #dc2626;">Reason for Rejection:</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Your application did not meet the eligibility criteria for this course.</span>
                  </div>
                `}

                <div class="divider"></div>

                <div class="footer-text">
                  <strong>🔄 What You Can Do Next?</strong><br><br>
                  <strong>✅ You can reapply for this course</strong><br>
                  If you believe this decision was made in error or you have additional information to share, you can submit a new application.<br><br>
                  <a href="${process.env.CLIENT_APP_URL}/my-registrations/${registration.id}" class="btn">View Application</a><br>
                  <a href="${process.env.CLIENT_APP_URL}/courses" class="btn-secondary">Browse Other Courses →</a>
                </div>
              </div>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — Empowering learning, one student at a time.</p>
                <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      await sendOTPEmail(recipientEmail, mailOptions);
    }

    return registration;
    
  } catch (error) {
    console.error('Update Registration Status Error:', error);
    throw error;
  }
}

  // Create payment record for approved registration
  async createPaymentRecord(registration) {
    try {
      // Calculate amount based on deadline
      const now = new Date();
      const deadline = new Date(registration.paymentDeadline);
      const isWithinDeadline = now <= deadline;

      // Determine which fee to apply
      let amount;
      let isDiscounted = false;

      if (isWithinDeadline && registration.discountedFeeAmount > 0) {
        amount = registration.discountedFeeAmount;
        isDiscounted = true;
      } else {
        amount = registration.originalFeeAmount
        isDiscounted = false;
      }

      // Create payment record
      const payment = await this.RegistrationPayment.create({
        registrationId: registration.id,
        amount: amount,
        originalFee: registration.originalFeeAmount ,
        discountedFee: registration.discountedFeeAmount,
        isDiscounted: isDiscounted,
        status: 'pending',
        paymentDate: new Date(),
      });

      return payment;
    } catch (error) {
      console.error('Create Payment Record Error:', error);
      throw error;
    }
  }

async processPayment(registrationId, paymentData ) {
  try {
    const { paymentMethod, transactionId, paymentScreenshotFile } = paymentData;

    const registration = await this.Registration.findByPk(registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Check if registration is approved
    if (registration.status !== 'approved') {
      throw new Error("Payment can only be made for approved registrations");
    }

    // Check if payment deadline has passed
    const now = new Date();
    const deadline = new Date(registration.paymentDeadline);
    const isWithinDeadline = now <= deadline;

    // Find payment record
    const payment = await this.RegistrationPayment.findOne({
      where: { registrationId }
    });

    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Recalculate amount based on current date
    let finalAmount = payment.amount;
    let isDiscounted = payment.isDiscounted;

    if (!isWithinDeadline) {
      // Use original fee if deadline passed
      finalAmount = registration.originalFeeAmount;
      isDiscounted = false;
      
      // Update payment record
      payment.amount = finalAmount;
      payment.isDiscounted = false;
    }

    // Update payment
    payment.paymentMethod = paymentMethod;
    payment.transactionId = transactionId;
    payment.status = 'review';
    payment.paidAt = new Date();

    // Handle payment screenshot
    if (paymentScreenshotFile) {
      // Delete old screenshot if exists
      if (payment.paymentScreenshotId) {
        await this.Media.destroy({ where: { id: payment.paymentScreenshotId } });
      }
      
      const media = await this.Media.create({
        url: paymentScreenshotFile.url,
        public_id: paymentScreenshotFile.public_id,
        type: 'image',
        folder: 'registration-payments',
        moduleType: 'payment',
        moduleId: payment.id
      });
      
      payment.paymentScreenshotId = media.id;
    }

    await payment.save();

    // Update registration payment status
    registration.paymentStatus = 'paid';
    registration.status = 'review';
    await registration.save();

    // Send payment received email to student
    const mailOptions = {
      subject: '💰 Payment Received - SM Academy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Received</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #f6f9fc;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .container {
              max-width: 560px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 24px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
              overflow: hidden;
              border: 1px solid rgba(0, 0, 0, 0.04);
            }
            .header {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
              padding: 40px 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -20%;
              width: 60%;
              height: 100%;
              background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
              border-radius: 50%;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -30%;
              left: -10%;
              width: 40%;
              height: 80%;
              background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
              border-radius: 50%;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              color: #ffffff;
              letter-spacing: -0.5px;
              position: relative;
              z-index: 1;
            }
            .logo span {
              background: linear-gradient(135deg, #667eea, #764ba2);
              padding: 2px 12px;
              border-radius: 8px;
              margin-left: 4px;
            }
            .logo-sub {
              font-size: 12px;
              color: rgba(255,255,255,0.6);
              font-weight: 400;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-top: 4px;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 40px 40px 30px;
            }
            .greeting {
              font-size: 22px;
              font-weight: 700;
              color: #1a1a2e;
              margin-bottom: 8px;
            }
            .sub-greeting {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .badge {
              display: inline-block;
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: white;
              font-size: 14px;
              font-weight: 600;
              padding: 6px 20px;
              border-radius: 20px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 16px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin: 20px 0;
            }
            .info-item {
              background: #f8fafc;
              padding: 14px 16px;
              border-radius: 12px;
              text-align: center;
            }
            .info-item .label {
              font-size: 11px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
            }
            .info-item .value {
              font-size: 15px;
              font-weight: 600;
              color: #1a1a2e;
              margin-top: 4px;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
              margin: 24px 0;
            }
            .footer-text {
              text-align: center;
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.8;
            }
            .footer-text strong {
              color: #6b7280;
            }
            .status-badge {
              display: inline-block;
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: white;
              font-size: 12px;
              font-weight: 600;
              padding: 4px 16px;
              border-radius: 20px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              background: #f8fafc;
              padding: 20px 40px;
              text-align: center;
              border-top: 1px solid rgba(0,0,0,0.04);
            }
            .footer p {
              font-size: 12px;
              color: #9ca3af;
              line-height: 1.8;
            }
            .footer .brand {
              color: #667eea;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              .container { margin: 16px; border-radius: 16px; }
              .header { padding: 30px 24px 24px; }
              .content { padding: 28px 24px 20px; }
              .greeting { font-size: 18px; }
              .footer { padding: 16px 24px; }
              .info-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SM <span>Academy</span></div>
              <div class="logo-sub">Secure · Trusted · Excellence</div>
            </div>
            
            <div class="content">
              <div class="badge">💰 Payment Received</div>
              <div class="greeting">📩 Thank You, ${registration.fullName}!</div>
              <div class="sub-greeting">
                We have successfully received your payment for <strong>${registration.courseName}</strong>. 
                Our team is currently <strong style="color: #f59e0b;">reviewing</strong> your payment confirmation.
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">Registration No.</div>
                  <div class="value">${registration.registrationNumber}</div>
                </div>
                <div class="info-item">
                  <div class="label">Course</div>
                  <div class="value">${registration.courseName}</div>
                </div>
                <div class="info-item">
                  <div class="label">Amount Paid</div>
                  <div class="value" style="color: #10b981; font-weight: 700;">Rs. ${finalAmount}</div>
                </div>
                <div class="info-item">
                  <div class="label">Payment Method</div>
                  <div class="value">${paymentMethod || 'N/A'}</div>
                </div>
              </div>

              <div style="background: #fffbeb; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #fde68a;">
                <strong style="color: #d97706;">⏳ Payment Status: Under Review</strong><br>
                <span style="color: #6b7280; font-size: 14px;">
                  Your payment receipt is being verified by our admin team. 
                  This process usually takes <strong>24-48 hours</strong>. 
                  You will receive a confirmation email once your payment is approved.
                </span>
              </div>

              <div class="divider"></div>

              <div class="footer-text">
                <strong>📌 What Happens Next?</strong><br><br>
                <strong>1️⃣ Payment Verification</strong> — Our team will verify your payment receipt<br>
                <strong>2️⃣ Confirmation</strong> — You'll receive a confirmation email once verified<br>
                <strong>3️⃣ Access Granted</strong> — You'll get access to the course materials<br><br>
                <strong>💡 Need Help?</strong><br>
                If you have any questions, please contact our support team.<br><br>
                <a href="${process.env.CLIENT_APP_URL}/my-registrations/${registration.id}" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; font-size: 14px; margin-top: 16px;">
                  View Registration →
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — Empowering learning, one student at a time.</p>
              <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendOTPEmail(registration.email, mailOptions);

    return { registration, payment };
    
  } catch (error) {
    console.error('Process Payment Error:', error);
    throw error;
  }
}

  // Generate registration number
  async generateRegistrationNumber() {
    try {
      const lastRegistration = await this.Registration.findOne({
        order: [['id', 'DESC']],
        attributes: ['registrationNumber', 'id']
      });

      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      let nextNumber = 1;
      
      if (lastRegistration && lastRegistration.registrationNumber) {
        const match = lastRegistration.registrationNumber.match(/REG-\d{6}-(\d{4})/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        } else {
          nextNumber = (lastRegistration.id || 0) + 1;
        }
      }
      
      const formattedNumber = String(nextNumber).padStart(4, '0');
      return `REG-${year}${month}-${formattedNumber}`;
    } catch (error) {
      console.error('Generate Registration Number Error:', error);
      const timestamp = Date.now();
      return `REG-${timestamp}`;
    }
  }

  // Get all registrations with payment details (Admin)
  async getAllRegistrations(filters = {}) {
    try {
      const { status, courseName, search, page = 1, limit = 50 } = filters;
      const where = {};
      const offset = (parseInt(page) - 1) * parseInt(limit);

      if (status) where.status = status;
      if (courseName) where.courseName = courseName;

      if (search) {
        where[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { whatsappNumber: { [Op.like]: `%${search}%` } },
          { registrationNumber: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await this.Registration.findAndCountAll({
        where,
        include: [
          {
            model: this.RegistrationPayment,
            as: 'payment',
            required: false,
          },
          {
            model: this.Course,
            as: 'course',
            required: false,
          },
          {
            model: this.User,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'email', 'phone']
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        registrations: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Get All Registrations Error:', error);
      throw error;
    }
  }

  // Get registration by ID with payment details
async getRegistrationById(id) {
  try {
    const registration = await this.Registration.findByPk(id, {
      include: [
        {
          model: this.RegistrationPayment,
          as: 'payment',
          required: false,
          include: [{
            model: this.Media,
            as: "screenshots"
          }]
        },
        {
          model: this.Course,
          as: 'course',
          required: false,
        },
        {
          model: this.User,
          as: 'user',
          required: false,
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });
    
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Get reapply history for this user and course
    const reapplyHistory = await this.Registration.findAll({
      where: {
        userId: registration.userId,
        courseId: registration.courseId,
        isReApplied: true,
        id: { [Op.ne]: id } // Exclude current registration
      },
      order: [["createdAt", "DESC"]],
      attributes: ['id', 'registrationNumber', 'status', 'createdAt', 'reApplyCountNumber', 'adminRemarks']
    });

    // Get original registration (first one for this course)
    const originalRegistration = await this.Registration.findOne({
      where: {
        userId: registration.userId,
        courseId: registration.courseId,
        isReApplied: false
      },
      order: [["createdAt", "ASC"]],
      attributes: ['id', 'registrationNumber', 'createdAt']
    });

    // Convert to plain object and add reapply info
    const registrationData = registration.toJSON();
    
    return {
      ...registrationData,
      reapplyHistory: reapplyHistory.map(item => ({
        id: item.id,
        registrationNumber: item.registrationNumber,
        status: item.status,
        createdAt: item.createdAt,
        reApplyCountNumber: item.reApplyCountNumber,
        adminRemarks: item.adminRemarks
      })),
      originalRegistration: originalRegistration ? {
        id: originalRegistration.id,
        registrationNumber: originalRegistration.registrationNumber,
        createdAt: originalRegistration.createdAt
      } : null,
      reApplyCountNumber: registration.reApplyCountNumber || 0,
      isReApplied: registration.isReApplied || false
    };

  } catch (error) {
    console.error('Get Registration By ID Error:', error);
    throw error;
  }
}

  // Delete registration and associated data
  async deleteRegistration(id) {
    try {
      const registration = await this.Registration.findByPk(id);
      if (!registration) {
        throw new Error("Registration not found");
      }
      
      await registration.destroy();
      return { message: "Registration deleted successfully" };
    } catch (error) {
      console.error('Delete Registration Error:', error);
      throw error;
    }
  }

  // Get registration statistics (Admin)
async getRegistrationStats() {
    try {
      const totalRegistrations = await this.Registration.count();
      
      // Get status stats
      const statusStats = await this.Registration.findAll({
        attributes: [
          'status',
          [this.Registration.sequelize.fn('COUNT', this.Registration.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      const paymentStats = await this.Registration.findAll({
        attributes: [
          'paymentStatus',
          [this.Registration.sequelize.fn('COUNT', this.Registration.sequelize.col('id')), 'count']
        ],
        group: ['paymentStatus']
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRegistrations = await this.Registration.count({
        where: { createdAt: { [Op.gte]: today } }
      });
      
      // Count by status - completed should be counted as approved
      const pendingRegistrations = await this.Registration.count({
        where: { status: 'pending' }
      });
      
      const approvedRegistrations = await this.Registration.count({
        where: { status: 'approved' }
      });
      
      const completedRegistrations = await this.Registration.count({
        where: { status: 'completed' }
      });
      
      const rejectedRegistrations = await this.Registration.count({
        where: { status: 'rejected' }
      });
      
      // Total approved = approved + completed
      const totalApproved = approvedRegistrations + completedRegistrations;
      
      // Payment stats
      const totalPayments = await this.RegistrationPayment.sum('amount', {
        where: { status: 'completed' }
      });

      const pendingPayments = await this.RegistrationPayment.count({
        where: { status: 'pending' }
      });

      const completedPayments = await this.RegistrationPayment.count({
        where: { status: 'completed' }
      });

      // Get payment deadline stats
      const now = new Date();
      const expiredDeadlines = await this.Registration.count({
        where: {
          status: 'approved',
          paymentDeadline: { [Op.lt]: now },
          paymentStatus: 'pending'
        }
      });

      return {
        summary: {
          total: totalRegistrations,
          today: todayRegistrations,
          pending: pendingRegistrations,
          approved: totalApproved, // Now includes both approved and completed
          rejected: rejectedRegistrations,
          completed: completedRegistrations // Keep separate for detailed view
        },
        financial: {
          totalCollected: totalPayments || 0,
          pendingPayments: pendingPayments,
          completedPayments: completedPayments,
          expiredDeadlines: expiredDeadlines
        },
        byStatus: statusStats.map(stat => ({
          status: stat.status,
          count: parseInt(stat.dataValues.count)
        })),
        byPaymentStatus: paymentStats.map(stat => ({
          status: stat.paymentStatus,
          count: parseInt(stat.dataValues.count)
        })),
        trend: []
      };
    } catch (error) {
      console.error('Get Registration Stats Error:', error);
      throw error;
    }
}

  // Get all registrations with full details (Admin)
  async getAllRegistrationsFull(filters = {}) {
    try {
      const { status, courseName, paymentStatus, search, startDate, endDate } = filters;
      const where = {};

      if (status) where.status = status;
      if (courseName) where.courseName = courseName;
      if (paymentStatus) where.paymentStatus = paymentStatus;

      if (search) {
        where[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { whatsappNumber: { [Op.like]: `%${search}%` } },
          { registrationNumber: { [Op.like]: `%${search}%` } }
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const registrations = await this.Registration.findAll({
        where,
        include: [
          {
            model: this.RegistrationPayment,
            as: 'payment',
            required: false,
          },
          {
            model: this.Course,
            as: 'course',
            required: false,
          },
          {
            model: this.User,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'email', 'phone']
          }
        ],
        order: [["createdAt", "DESC"]]
      });

      return {
        total: registrations.length,
        registrations
      };
    } catch (error) {
      console.error('Get All Registrations Full Error:', error);
      throw error;
    }
  }


  // Update payment status (Admin)
async updatePaymentStatus(registrationId, paymentStatus, adminRemarks = null, email) {
  try {
    const registration = await this.Registration.findByPk(registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Find payment record
    const payment = await this.RegistrationPayment.findOne({
      where: { registrationId }
    });

    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Update payment status
    payment.status = paymentStatus;
    if (adminRemarks) {
      payment.adminRemarks = adminRemarks;
    }

    // If payment is completed
    if (paymentStatus === 'completed') {
      registration.paymentStatus = 'paid';
      registration.status = 'completed';
      payment.paidAt = new Date();
    }
    // If payment is failed
    else if (paymentStatus === 'failed') {
      registration.paymentStatus = 'failed';
      registration.status = 'rejected';
    }

    await payment.save();
    await registration.save();

    // Determine recipient email
    const recipientEmail = registration.email;

    // Send email based on payment status
    if (paymentStatus === 'completed') {
      const mailOptions = {
        subject: '✅ Payment Confirmed - SM Academy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Confirmed</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #f6f9fc;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              .container {
                max-width: 560px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                border: 1px solid rgba(0, 0, 0, 0.04);
              }
              .header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 40px 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 60%;
                height: 100%;
                background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
                border-radius: 50%;
              }
              .header::after {
                content: '';
                position: absolute;
                bottom: -30%;
                left: -10%;
                width: 40%;
                height: 80%;
                background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
                border-radius: 50%;
              }
              .logo {
                font-size: 28px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -0.5px;
                position: relative;
                z-index: 1;
              }
              .logo span {
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 2px 12px;
                border-radius: 8px;
                margin-left: 4px;
              }
              .logo-sub {
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                font-weight: 400;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-top: 4px;
                position: relative;
                z-index: 1;
              }
              .content {
                padding: 40px 40px 30px;
              }
              .greeting {
                font-size: 22px;
                font-weight: 700;
                color: #1a1a2e;
                margin-bottom: 8px;
              }
              .sub-greeting {
                color: #6b7280;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .badge {
                display: inline-block;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                font-size: 14px;
                font-weight: 600;
                padding: 6px 20px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 16px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 20px 0;
              }
              .info-item {
                background: #f8fafc;
                padding: 14px 16px;
                border-radius: 12px;
                text-align: center;
              }
              .info-item .label {
                font-size: 11px;
                color: #9ca3af;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
              }
              .info-item .value {
                font-size: 15px;
                font-weight: 600;
                color: #1a1a2e;
                margin-top: 4px;
              }
              .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
                margin: 24px 0;
              }
              .footer-text {
                text-align: center;
                color: #9ca3af;
                font-size: 13px;
                line-height: 1.8;
              }
              .footer-text strong {
                color: #6b7280;
              }
              .btn {
                display: inline-block;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                margin-top: 16px;
              }
              .footer {
                background: #f8fafc;
                padding: 20px 40px;
                text-align: center;
                border-top: 1px solid rgba(0,0,0,0.04);
              }
              .footer p {
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.8;
              }
              .footer .brand {
                color: #667eea;
                font-weight: 600;
              }
              @media (max-width: 600px) {
                .container { margin: 16px; border-radius: 16px; }
                .header { padding: 30px 24px 24px; }
                .content { padding: 28px 24px 20px; }
                .greeting { font-size: 18px; }
                .footer { padding: 16px 24px; }
                .info-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">SM <span>Academy</span></div>
                <div class="logo-sub">Secure · Trusted · Excellence</div>
              </div>
              
              <div class="content">
                <div class="badge">✅ Payment Confirmed</div>
                <div class="greeting">🎉 Thank You, ${registration.fullName}!</div>
                <div class="sub-greeting">
                  Your payment for <strong>${registration.courseName}</strong> has been <strong style="color: #10b981;">confirmed</strong> successfully!
                </div>
                
                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">Registration No.</div>
                    <div class="value">${registration.registrationNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Course</div>
                    <div class="value">${registration.courseName}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Amount Paid</div>
                    <div class="value" style="color: #10b981; font-weight: 700;">Rs. ${payment.amount}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Payment Method</div>
                    <div class="value">${payment.paymentMethod || 'N/A'}</div>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="footer-text">
                  <strong>🎊 You're All Set!</strong><br>
                  Your registration is now complete. You will receive further instructions about the course shortly.<br><br>
                  <strong>Next Steps:</strong><br>
                  1️⃣ Check your email for course details<br>
                  2️⃣ Join our community groups<br>
                  3️⃣ Prepare for your first session<br><br>
                  <a href="${process.env.CLIENT_APP_URL}/my-registrations/${registration.id}" class="btn">View Registration →</a>
                </div>
                
                ${adminRemarks ? `
                  <div class="divider"></div>
                  <div class="footer-text" style="text-align: left; background: #f8fafc; padding: 16px; border-radius: 12px;">
                    <strong>Admin Remarks:</strong><br>
                    ${adminRemarks}
                  </div>
                ` : ''}
              </div>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — Empowering learning, one student at a time.</p>
                <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      await sendOTPEmail(recipientEmail, mailOptions);
      
    } else if (paymentStatus === 'failed') {
      const mailOptions = {
        subject: '❌ Payment Failed - SM Academy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Failed</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #f6f9fc;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              .container {
                max-width: 560px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                border: 1px solid rgba(0, 0, 0, 0.04);
              }
              .header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 40px 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 60%;
                height: 100%;
                background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
                border-radius: 50%;
              }
              .header::after {
                content: '';
                position: absolute;
                bottom: -30%;
                left: -10%;
                width: 40%;
                height: 80%;
                background: radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%);
                border-radius: 50%;
              }
              .logo {
                font-size: 28px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -0.5px;
                position: relative;
                z-index: 1;
              }
              .logo span {
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 2px 12px;
                border-radius: 8px;
                margin-left: 4px;
              }
              .logo-sub {
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                font-weight: 400;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-top: 4px;
                position: relative;
                z-index: 1;
              }
              .content {
                padding: 40px 40px 30px;
              }
              .greeting {
                font-size: 22px;
                font-weight: 700;
                color: #1a1a2e;
                margin-bottom: 8px;
              }
              .sub-greeting {
                color: #6b7280;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .badge {
                display: inline-block;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                font-size: 14px;
                font-weight: 600;
                padding: 6px 20px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 16px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 20px 0;
              }
              .info-item {
                background: #f8fafc;
                padding: 14px 16px;
                border-radius: 12px;
                text-align: center;
              }
              .info-item .label {
                font-size: 11px;
                color: #9ca3af;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
              }
              .info-item .value {
                font-size: 15px;
                font-weight: 600;
                color: #1a1a2e;
                margin-top: 4px;
              }
              .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
                margin: 24px 0;
              }
              .btn {
                display: inline-block;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                margin-top: 16px;
              }
              .btn-secondary {
                display: inline-block;
                background: transparent;
                color: #667eea;
                text-decoration: none;
                padding: 10px 28px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                margin-top: 10px;
                border: 2px solid #667eea;
              }
              .footer-text {
                text-align: center;
                color: #9ca3af;
                font-size: 13px;
                line-height: 1.8;
              }
              .footer-text strong {
                color: #6b7280;
              }
              .footer {
                background: #f8fafc;
                padding: 20px 40px;
                text-align: center;
                border-top: 1px solid rgba(0,0,0,0.04);
              }
              .footer p {
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.8;
              }
              .footer .brand {
                color: #667eea;
                font-weight: 600;
              }
              @media (max-width: 600px) {
                .container { margin: 16px; border-radius: 16px; }
                .header { padding: 30px 24px 24px; }
                .content { padding: 28px 24px 20px; }
                .greeting { font-size: 18px; }
                .footer { padding: 16px 24px; }
                .info-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">SM <span>Academy</span></div>
                <div class="logo-sub">Secure · Trusted · Excellence</div>
              </div>
              
              <div class="content">
                <div class="badge">❌ Payment Failed</div>
                <div class="greeting">Dear ${registration.fullName},</div>
                <div class="sub-greeting">
                  We regret to inform you that your payment for <strong>${registration.courseName}</strong> has <strong style="color: #ef4444;">failed</strong>.
                </div>
                
                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">Registration No.</div>
                    <div class="value">${registration.registrationNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Course</div>
                    <div class="value">${registration.courseName}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Amount</div>
                    <div class="value" style="color: #ef4444; font-weight: 700;">Rs. ${payment.amount}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Payment Method</div>
                    <div class="value">${payment.paymentMethod || 'N/A'}</div>
                  </div>
                </div>

                ${adminRemarks ? `
                  <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #fecaca;">
                    <strong style="color: #dc2626;">Reason for Failure:</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">${adminRemarks}</span>
                  </div>
                ` : `
                  <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #fecaca;">
                    <strong style="color: #dc2626;">Reason for Failure:</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Payment verification failed. Please contact support for assistance.</span>
                  </div>
                `}

                <div class="divider"></div>

                <div class="footer-text">
                  <strong>🔄 What You Can Do Next?</strong><br><br>
                  <strong>✅ Try again with a different payment method</strong><br>
                  You can retry the payment using a different method or contact our support team for assistance.<br><br>
                  <a href="${process.env.CLIENT_APP_URL}/my-registrations/${registration.id}" class="btn">View Registration →</a><br>
                  <a href="${process.env.CLIENT_APP_URL}/support" class="btn-secondary">Contact Support</a>
                </div>
              </div>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} <span class="brand">SM Academy</span> — Empowering learning, one student at a time.</p>
                <p style="margin-top: 4px; font-size: 11px; color: #d1d5db;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      await sendOTPEmail(recipientEmail, mailOptions);
    }

    return { registration, payment };
    
  } catch (error) {
    console.error('Update Payment Status Error:', error);
    throw error;
  }
}

// Get review payment registrations (Admin)
async getReviewPaymentRegistrations(filters = {}) {
  try {
    const { status, courseName, search, page = 1, limit = 50 } = filters;
    const where = {
      paymentStatus: 'paid',
      status: 'review'
    };
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (status) where.status = status;
    if (courseName) where.courseName = courseName;

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { whatsappNumber: { [Op.like]: `%${search}%` } },
        { registrationNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await this.Registration.findAndCountAll({
      where,
      include: [
        {
          model: this.RegistrationPayment,
          as: 'payment',
          required: true,
          where: { status: ['pending', 'review'] }
        },
        {
          model: this.Course,
          as: 'course',
          required: false,
        },
        {
          model: this.User,
          as: 'user',
          required: false,
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      registrations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error('Get Review Payment Registrations Error:', error);
    throw error;
  }
}




// Re-apply for a course (create new registration from rejected one)
async reApplyRegistration(originalRegistrationId, additionalNotes = null) {
  try {
    // Find the original rejected registration
    const originalRegistration = await this.Registration.findByPk(originalRegistrationId);
    if (!originalRegistration) {
      throw new Error("Original registration not found");
    }

    // Check if registration is rejected
    if (originalRegistration.status !== 'rejected') {
      throw new Error("Only rejected registrations can be re-applied");
    }

    // Check if reapply is allowed (optional: limit reapply count)
    const reApplyCount = originalRegistration.reApplyCountNumber || 0;
    if (reApplyCount >= 3) {
      throw new Error("Maximum reapply attempts (3) exceeded");
    }

    // Create new registration with data from original
    const newRegistrationData = {
      userId: originalRegistration.userId,
      courseId: originalRegistration.courseId,
      courseName: originalRegistration.courseName,
      courseCategory: originalRegistration.courseCategory || "other",
      fullName: originalRegistration.fullName,
      email: originalRegistration.email,
      whatsappNumber: originalRegistration.whatsappNumber,
      phoneNumber: originalRegistration.phoneNumber,
      address: originalRegistration.address,
      city: originalRegistration.city || "Chiniot",
      qualification: originalRegistration.qualification,
      reason: originalRegistration.reason,
      previousExperience: originalRegistration.previousExperience,
      notes: additionalNotes || originalRegistration.notes,
      originalFeeAmount: originalRegistration.originalFeeAmount,
      discountedFeeAmount: originalRegistration.discountedFeeAmount,
      status: "pending",
      paymentStatus: "pending",
      isReApplied: true,
      reApplyCountNumber: reApplyCount + 1
    };

    // Generate new registration number
    const registrationNumber = await this.generateRegistrationNumber();
    newRegistrationData.registrationNumber = registrationNumber;

    // Create new registration
    const newRegistration = await this.Registration.create(newRegistrationData);

    // Update original registration to mark as re-applied
    await originalRegistration.update({
      isReApplied: true,
      reApplyCountNumber: reApplyCount + 1
    });

    return {
      newRegistration,
      originalRegistration,
      reApplyCount: reApplyCount + 1
    };
  } catch (error) {
    console.error('Re-Apply Registration Error:', error);
    throw error;
  }
}

// Get user's reapply history
async getReapplyHistory(userId) {
  try {
    const registrations = await this.Registration.findAll({
      where: { 
        userId,
        isReApplied: true
      },
      include: [
        {
          model: this.Course,
          as: 'course',
          required: false,
          attributes: ['id', 'name', 'category', 'icon']
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return registrations;
  } catch (error) {
    console.error('Get Reapply History Error:', error);
    throw error;
  }
}

// Get original registration by ID (with reapply info)
async getRegistrationWithReapplyInfo(id) {
  try {
    const registration = await this.Registration.findByPk(id, {
      include: [
        {
          model: this.RegistrationPayment,
          as: 'payment',
          required: false,
        },
        {
          model: this.Course,
          as: 'course',
          required: false,
        },
        {
          model: this.User,
          as: 'user',
          required: false,
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });
    
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Get reapply history for this user and course
    const reapplyHistory = await this.Registration.findAll({
      where: {
        userId: registration.userId,
        courseId: registration.courseId,
        isReApplied: true
      },
      order: [["createdAt", "DESC"]],
      attributes: ['id', 'registrationNumber', 'status', 'createdAt', 'reApplyCountNumber']
    });

    // Find original registration (first one for this course)
    const originalRegistration = await this.Registration.findOne({
      where: {
        userId: registration.userId,
        courseId: registration.courseId,
        isReApplied: false
      },
      order: [["createdAt", "ASC"]]
    });

    return {
      ...registration.toJSON(),
      reapplyHistory,
      originalRegistration: originalRegistration ? {
        id: originalRegistration.id,
        registrationNumber: originalRegistration.registrationNumber,
        createdAt: originalRegistration.createdAt
      } : null
    };
  } catch (error) {
    console.error('Get Registration With Reapply Info Error:', error);
    throw error;
  }
}

}

module.exports = RegistrationService;