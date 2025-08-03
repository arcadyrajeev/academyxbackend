const bcrypt = require("bcryptjs");
const prisma = require("../utils/prismaClient");
const ApiError = require("../utils/apiError");
const { use } = require("passport");

exports.findUserById = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
  });

exports.findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

exports.createUser = async ({ username, email, password }) => {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { username, email, password: hashed } });
};

exports.updateUserProfile = (userId, data) =>
  prisma.user.update({ where: { id: userId }, data });

exports.updatePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, "Incorrect old password");

  const hashed = await bcrypt.hash(newPassword, 10);
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
};

exports.deleteUserAccount = (userId) =>
  prisma.user.delete({
    where: { id: userId },
  });
