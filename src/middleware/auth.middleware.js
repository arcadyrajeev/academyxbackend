const prima = require("../utils/prismaClient");
jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(403, "unauthorised access");
  }
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await prisma.user.findUnique({
    where: { id: id.decoded },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new ApiError(403, "invalid token");
  }

  //    console.log(user)
  req.user = user;
  next();
});
module.exports = { verifyJWT };
