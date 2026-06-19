const path = require("path");

const initRoutes = (app, modules, models) => {
  const { controllers, services , middlewares } = modules;


  const tempUploadRoutes = require("../routes/upload");
  
  const userRoutes = require("../routes/userRoutes")(controllers  ,middlewares);
  const courseRoutes = require("../routes/courseRoutes")( controllers , middlewares );
  const adminRegistrationRoutes = require("../routes/adminRoutes")( controllers , middlewares );
  const publicRegistrationRoutes = require("../routes/registrationRoutes")(controllers , middlewares);
  const visitorRoutes = require("../routes/visitorRoutes")(controllers , middlewares);


  app.use("/api/auth-user", userRoutes);
  
  app.use("/api/courses", courseRoutes);
  
  app.use("/api/visitors", visitorRoutes);
  
  app.use("/api/upload", tempUploadRoutes);
  
  app.use("/api/admin", adminRegistrationRoutes);
  
  app.use("/api/registrations", publicRegistrationRoutes);

};

module.exports = initRoutes;
