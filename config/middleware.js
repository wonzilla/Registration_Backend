const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const initMiddleware = (app) => {
  // Cookie parser
  app.use(cookieParser());
  
  // CORS
  app.use(
    cors({
      origin: ["http://localhost:5175", "http://localhost:5173" ,"http://192.168.0.106:5174", "http://192.168.0.106:5173",  "https://192.168.0.106:5174", "https://192.168.0.106:5173","https://192.168.0.106:5175" , "http://192.168.0.106:5175"],
      credentials: true,
    })
  );
  
  // Body parsers
  app.use(express.json({ limit: "50mb" }));
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  
  // DB middleware
  app.use((req, res, next) => {
    next();
  });
};

module.exports = initMiddleware;