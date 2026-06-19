




const UserController = require("../controllers/userController")
const CourseController = require("../controllers/courseController")
const RegistrationController = require("../controllers/registrationController")



const UserService = require("../services/userService")
const CourseService = require("../services/courseService")
const RegistrationService = require("../services/registrationService")
const AuthMiddleware = require("../middleware/auth")
const VisitorController = require("../controllers/visitorController")
const VisitorService = require("../services/visitorService")



const initModules = (models) => {
  
 const registrationService = new RegistrationService(models)
 const userService = new UserService(models)
 const courseService = new CourseService(models)
 const visitorService = new VisitorService(models)


 const registrationController = new RegistrationController(registrationService) 
 const userController = new UserController(userService) 
 const courseController = new CourseController(courseService) 
 const visitorController = new VisitorController(visitorService) 

 // MiddleWare

  const authMiddleware = new AuthMiddleware(models) 
 
  return {
    services: {
      userService,
      courseService,
        registrationService,
        visitorService,
    },
    controllers: {
      userController,
      courseController,
      registrationController,
      visitorController,
    },
   middlewares:{
    authMiddleware,
   }
  };
};

module.exports = initModules;