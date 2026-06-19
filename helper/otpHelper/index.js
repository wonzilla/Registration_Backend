const SibApiV3Sdk = require("sib-api-v3-sdk");

const sendOtpEmail = async (to, mailOptions) => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

    const api = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = {
      sender: {
        email: "smacademy74@gmail.com",
        name: "Sirat Ul Mustaqeem Academy",
      },
      to: [{ email: to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
    };

    const response = await api.sendTransacEmail(sendSmtpEmail);

    console.log("Email sent successfully:", response.messageId);
    return true;
  } catch (error) {
    console.error("Brevo API Email Error:", error);
    throw error;
  }
};

module.exports = sendOtpEmail;