// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  uploadProfileImage,
  uploadCoverImage,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/user.controller");

router.post("/:userId/profile/image", uploadProfileImage);
router.post("/:userId/cover/image", uploadCoverImage);
router.put("/:userId/updateprofile", updateProfile);
router.put("/:userId/changepassword", changePassword);
router.delete("/:userId/delete", deleteAccount);

module.exports = router;
