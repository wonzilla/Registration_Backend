// utils/responseHelper.js
const { v4: uuidv4 } = require('uuid');

// Generate request ID middleware
const generateRequestId = (req, res, next) => {
  req.id = uuidv4();
  next();
};

// Standard response function
const sendResponse = (req, res, {
  statusCode = 200,
  success = true,
  code = "SUCCESS",
  message = "Request successful",
  data = null,
  errors = null,
  meta = {}
}) => {
  res.status(statusCode).json({
    success,
    code,
    message,
    data,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id || null,
      ...meta
    }
  });
};

module.exports = { sendResponse, generateRequestId };