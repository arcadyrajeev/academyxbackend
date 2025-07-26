const jwt = require("jsonwebtoken")
const asyncHandler = require("../utils/asyncHandler")
const ApiError = require("../utils/apiError")
const User = require("../models/user.model")

const verifyJWT = asyncHandler(async (req,res,next)=>{
   
   const token = req.cookies?.accessToken

   if(!token){
    throw new ApiError(403,"unauthorised access")
   }
   const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
   
   const user = await User.findById(decoded._id).select("-password -refreshToken")
   if(!user){
    throw new ApiError(403,"invalid token")
   }
   
//    console.log(user)
   req.user = user
   next()

})
module.exports = {verifyJWT}