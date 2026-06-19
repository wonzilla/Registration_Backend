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
      origin: ["https://registrations.siratulmustaqeem.academy", "https://siratulmustaqeem.academy" , "https://192.168.43.24:5175"],
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