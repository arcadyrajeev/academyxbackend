const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");

// Generate Access and Refresh Tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Verify a JWT token
const verifyToken = (token, secret = process.env.ACCESS_TOKEN_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }
};

// Compare hashed password
const validatePassword = async (rawPassword, hashedPassword) => {
  const isValid = await bcrypt.compare(rawPassword, hashedPassword);
  if (!isValid) throw new ApiError(401, "Incorrect password");
  return true;
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

module.exports = {
  generateTokens,
  verifyToken,
  validatePassword,
  hashPassword,
};
