const nodemailer = require("nodemailer");

const sendOTPEmail = async (to, mailOptions) => {
  console.log("sending email");

  const transporter = nodemailer.createTransport({
    host: "74.125.136.108", // smtp.gmail.com ka IPv4 test
    port: 587,
    secure: false,
    auth: {
      user: "smacademy74@gmail.com",
      pass: "dlpe okze cvub ctbu",
    },
    tls: {
      servername: "smtp.gmail.com",
    },
  });

  console.lot("transport config cleared now sending");

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
