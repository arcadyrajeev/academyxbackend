// Refactored to use Prisma for DB + Supabase for Storage

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { supabase } = require("../utils/supabaseStorage");
const prisma = require("../utils/prismaClient");

const generateTokens = async (userId) => {
  try {
    const accessToken = jwt.sign(
      { id: userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(400, "Token generation failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((val) => !val?.trim()))
    throw new ApiError(400, "All fields required");
  if (!email.includes("@")) throw new ApiError(400, "Invalid email");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(403, "User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
  });

  return res.status(200).json(new ApiResponse(200, user, "User registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ([email, password].some((val) => !val?.trim()))
    throw new ApiError(400, "Email and password required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "User not found");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new ApiError(401, "Incorrect password");

  const { accessToken, refreshToken } = await generateTokens(user.id);
  const options = {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, { user, accessToken, refreshToken }, "Logged in")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const options = { httpOnly: true, sameSite: "Lax", secure: false };
  return res
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "Logged out"));
});

const uploadFileToSupabase = async (file, folder) => {
  const { data, error } = await supabase.storage
    .from("user-assets")
    .upload(`${folder}/${file.originalname}`, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
  if (error) throw new ApiError(500, "Upload failed");
  const { data: urlData } = supabase.storage
    .from("user-assets")
    .getPublicUrl(data.path);
  return urlData.publicUrl;
};

const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");
  const imageUrl = await uploadFileToSupabase(req.file, "profile-images");
  await prisma.user.update({
    where: { id: req.user.id },
    data: { profileImage: imageUrl },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Profile image updated"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "Unauthorized");

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const { accessToken, refreshToken } = await generateTokens(decoded.id);
  const options = {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, { accessToken, refreshToken }, "Tokens refreshed")
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;
  if (!newPassword?.trim()) throw new ApiError(400, "Password required");
  if (newPassword === oldPassword)
    throw new ApiError(403, "New password matches old");

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new ApiError(400, "Incorrect old password");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Password changed"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, bio } = req.body;
  if ([fullname, bio].some((val) => !val?.trim()))
    throw new ApiError(400, "Fullname and bio required");

  await prisma.user.update({
    where: { id: req.user.id },
    data: { fullname, bio },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Profile updated"));
});

const uploadCoverImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Cover image required");
  const imageUrl = await uploadFileToSupabase(req.file, "cover-images");
  await prisma.user.update({
    where: { id: req.user.id },
    data: { coverImage: imageUrl },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Cover image uploaded"));
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  uploadProfileImage,
  refreshAccessToken,
  changePassword,
  updateProfile,
  uploadCoverImage,
};
