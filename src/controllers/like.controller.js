const  mongoose  = require("mongoose");
const Like = require("../models/like.model");
const asyncHandler = require("../utils/asyncHandler")
const ApiError = require("../utils/apiError")
const ApiResponse = require("../utils/apiResponse")


const toggleLike = asyncHandler(async(req,res)=>{
    const {courseId} = req.params;
    if(!courseId){
        throw new ApiError(400,"courseID is required")
    }
   const alreadyLiked = await Like.findOne(
    {
        course: new mongoose.Types.ObjectId(courseId),
        user: req.user?._id

   })
   if(alreadyLiked){
    await Like.findOneAndDelete({
        course: new mongoose.Types.ObjectId(courseId),
        user: req.user?._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"unliked successfully")
    )
   }else{
    const like = await Like.create({
        course:new mongoose.Types.ObjectId(courseId),
        user:req.user?._id
    })
    return res
    .status(200)
    .json( 
        new ApiResponse(200,like,"like Successfully")
    )
   }
})

module.exports = {
    toggleLike
}