require("dotenv/config");
const fs = require("fs");
const express = require("express");
const app = express();
const sequelize = require("./config/database");

const models = require("./models");
const initModules = require("./config/modules");
const initRoutes = require("./config/routes");
const initMiddleware = require("./config/middleware");

initMiddleware(app);

const modules = initModules(models);

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
let server = null;

try {
  // Check if SSL certificates exist
  const sslKeyPath = process.env.SSL_KEY_PATH || "./192.168.0.106-key.pem";
  const sslCertPath = process.env.SSL_CERT_PATH || "./192.168.0.106.pem";
  
  if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    console.warn("⚠️ SSL certificates not found. Starting HTTP server instead...");
    
    const http = require("http");
    server = http.createServer(app);
    console.log("🔄 Running in HTTP mode (no SSL)");
  } else {
    const https = require("https");
    server = https.createServer(
      {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      },
      app
    );
    console.log("🔒 Running in HTTPS mode");
  }
  
  server.listen(PORT, "0.0.0.0", () => {
    const protocol = server instanceof require("https").Server ? 'https' : 'http';
    console.log(`🟢 Server started on ${protocol}://0.0.0.0:${PORT}`);
  });
  
  console.log("✅ Server initialized successfully");

} catch (serverError) {
  console.error("❌ Failed to start server:", serverError.message);
  
  // Fallback to HTTP if HTTPS fails
  if (!server) {
    console.log("🔄 Falling back to HTTP server...");
    const http = require("http");
    server = http.createServer(app);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🟢 Server started (HTTP fallback) on http://0.0.0.0:${PORT}`);
    });
    console.log("✅ Server initialized with HTTP fallback");
  }
}

initializeDatabaseAndCronJobs().catch(error => {
  console.error("❌ Unhandled database initialization error:", error.message);
});

module.exports = { app, server };