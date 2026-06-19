const nodemailer = require("nodemailer");
require("dotenv")

const sendOTPEmail = async (to, mailOptions) => {
  console.log("sending email");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

  console.log("transport config cleared now sending");

  await transporter.verify();
  console.log("SMTP Ready");

  const mailConfig = {
    from: '"Sirat Ul Mustaqeem Academy" <smacademy74@gmail.com>',
    to: to,
    subject: mailOptions.subject, // Directly access the properties
    html: mailOptions.html, // Directly access the properties
  };

  try {
    await transporter.sendMail(mailConfig);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendOTPEmail; // ✅ export is correct
