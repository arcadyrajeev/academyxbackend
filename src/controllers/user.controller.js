// controllers/user.controller.js
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");

const { uploadFileToSupabase } = require("../utils/supabaseStorage");

const { validatePassword } = require("../services/auth.service");

const {
  updateUserProfile,
  updatePassword,
  findUserById,
  deleteUserAccount,
} = require("../services/user.service");

const uploadProfileImage = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await findUserById(userId);

  if (!user) throw new ApiError(404, "user not found");

  if (!req.file) throw new ApiError(400, "No file provided");
  const imageUrl = await uploadFileToSupabase(req.file, "profile-images");
  await updateUserProfile(req.user.id, { profileImage: imageUrl });
  res.status(200).json(new ApiResponse(200, {}, "Profile image uploaded"));
});

const uploadCoverImage = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await findUserById(userId);

  if (!user) throw new ApiError(404, "user not found");

  if (!req.file) throw new ApiError(400, "No file provided");
  const imageUrl = await uploadFileToSupabase(req.file, "cover-images");
  await updateUserProfile(req.user.id, { coverImage: imageUrl });
  res.status(200).json(new ApiResponse(200, {}, "Cover image uploaded"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await findUserById(userId);

  if (!user) throw new ApiError(404, "user not found");

  const { fullname, bio } = req.body;
  await updateUserProfile(req.user.id, { fullname, bio });
  res.status(200).json(new ApiResponse(200, {}, "Profile updated"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await findUserById(userId);

  if (!user) throw new ApiError(404, "user not found");

  const { oldPassword, newPassword } = req.body;
  await updatePassword(req.user.id, oldPassword, newPassword);
  res.status(200).json(new ApiResponse(200, {}, "Password changed"));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  const user = await findUserById(userId);

  if (!user) throw new ApiError(404, "user not found");

  const isValidPassword = await validatePassword(password, user.password);
  if (!isValidPassword) {
    throw new ApiError(401, "Incorrect password");
  }

  await deleteUserAccount(userId);

  res.status(200).json(new ApiResponse(200, {}, "Account deleted"));
});

module.exports = {
  uploadProfileImage,
  uploadCoverImage,
  updateProfile,
  changePassword,
  deleteAccount,
};
