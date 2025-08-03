const ApiError = require("../utils/apiError");

const verifyAdminApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return next(new ApiError(403, "Forbidden: Invalid API key"));
  }
  next();
};

module.exports = { verifyAdminApiKey };
