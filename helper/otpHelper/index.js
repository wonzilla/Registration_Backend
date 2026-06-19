const nodemailer = require('nodemailer');

const sendOTPEmail = async (to, mailOptions) => {
   const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
auth: {
            user: "smacademy74@gmail.com", 
            pass: "dlpe okze cvub ctbu"  
        }
});

await transporter.verify();
console.log("SMTP Ready");

     const mailConfig = {
        from: '"Sirat Ul Mustaqeem Academy" <smacademy74@gmail.com>',
        to: to,
        subject: mailOptions.subject,  // Directly access the properties
        html: mailOptions.html        // Directly access the properties
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