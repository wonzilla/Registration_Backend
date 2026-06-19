const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin || false,
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || process.env.JSON_WEB_TOKEN_SECRET_KEY,
    { expiresIn: "10m" }
  );
};

const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JSON_WEB_TOKEN_REFRESH_KEY,
    { expiresIn: "7d" }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };