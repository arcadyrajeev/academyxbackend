// controllers/auth.controller.js
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const {
  generateTokens,
  validatePassword,
} = require("../services/auth.service");
const { findUserByEmail, createUser } = require("../services/user.service");

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const user = await createUser({ username, email, password });
  return res.status(201).json(new ApiResponse(201, user, "User registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  const isValid = await validatePassword(password, user.password);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateTokens(user.id);
  return res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true })
    .cookie("refreshToken", refreshToken, { httpOnly: true })
    .json(
      new ApiResponse(200, { user, accessToken, refreshToken }, "Login success")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  return res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "Logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Your existing logic...
});

module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken };
