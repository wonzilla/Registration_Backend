require("dotenv/config");
const fs = require("fs");
const express = require("express");
const app = express();
const sequelize = require("./config/database");
const http = require("http");
const models = require("./models");
const initModules = require("./config/modules");
const initRoutes = require("./config/routes");
const initMiddleware = require("./config/middleware");
const sendOtpEmail = require("./helper/otpHelper");

initMiddleware(app);

const modules = initModules(models);




app.get("/test-email", async (req, res) => {
  try {
    await sendOtpEmail("tahqeeq86@gmail.com", {
      subject: "🎉 Welcome to Sirat Ul Mustaqeem Academy",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h1>Welcome 👋</h1>
          <p>Your account has been successfully created.</p>
          <p>We are glad to have you with us.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Test email sent successfully 🚀",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Email failed",
    });
  }
});

initRoutes(app, modules, models);

const initializeDatabaseAndCronJobs = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database Connection established.");

    // await sequelize.sync({ alter: true });
    // await sequelize.sync();
    console.log("✅ All models synchronized successfully.");
    databaseInitialized = true;

  } catch (error) {
    console.error("❌ Database initialization error:");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("SQL:", error.sql);
    console.error("Main Error:", error);
    databaseInitialized = false;
  }
};

// ============ START SERVER IMMEDIATELY ============
const PORT = process.env.PORT || 5002;


    
  let server  = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🟢 Server started`);
    });

initializeDatabaseAndCronJobs().catch(error => {
  console.error("❌ Unhandled database initialization error:", error.message);
});

console.log("database synced successfully")

module.exports = { app, server };