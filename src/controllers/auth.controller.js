// controllers/auth.controller.js
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const {
  generateTokens,
  validatePassword,
} = require("../services/auth.service");

const validator = require("validator");
const emailExistence = require("email-existence");

const { findUserByEmail, createUser } = require("../services/user.service");

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Check if email is valid: uncomment when ready for deployment

  // const exists = await new Promise((resolve) => {
  //   emailExistence.check(email, (err, response) => {
  //     resolve(response); // true or false
  //   });
  // });

  // if (!exists) {
  //   throw new ApiError(400, "Email address does not exist");
  // }

  const user = await createUser({ username, email, password });
  return res.status(201).json(new ApiResponse(201, user, "User registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user
  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(401, "Invalid credentials");

  // 2. Validate password
  const isValid = await validatePassword(password, user.password);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

  // 3. Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user.id);

  // 4. Sanitize user (remove password, etc.)
  const { password: _, refreshToken: __, ...safeUser } = user;

  // 5. Set tokens as HTTP-only cookies
  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    });

  // 6. Respond with user info only (no token in body)
  return res
    .status(200)
    .json(new ApiResponse(200, { user: safeUser }, "Login success"));
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
