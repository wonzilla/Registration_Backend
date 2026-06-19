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

initMiddleware(app);

const modules = initModules(models);

initRoutes(app, modules, models);

const initializeDatabaseAndCronJobs = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database Connection established.");

    await sequelize.sync({ alter: true });
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