const nodemailer = require('nodemailer');

const sendOTPEmail = async (to, mailOptions) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "smacademy74@gmail.com", 
            pass: "dlpe okze cvub ctbu"  
        }
    });
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