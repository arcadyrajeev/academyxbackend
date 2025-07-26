const ApiError = require("./apiError");
const fs = require("fs")
const cloudinary = require("cloudinary").v2

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    const uploadProfileImageOnCloudinary = async(localPath)=>{
        console.log("uploadProfileImageOnCloudinary",localPath)
        // Upload an image
       try {
         if(!localPath) return null
          const upload = await cloudinary.uploader.upload(localPath,{
             resource_type:"auto"
          })
          fs.unlinkSync(localPath)
          return upload
       } catch (error) {
        throw new ApiError(500,error.message|| "something went wrong")
       }
    }
    const uploadVideoOnCloudinary = async(filePath)=>{
       try {
         
         const response = await cloudinary.uploader.upload(filePath,{resource_type:"video"})
         fs.unlinkSync(filePath)
         return response;
       } catch (error) { 
            throw new ApiError(502,error.message || "something went wrong while uploading video")
       }
    }
    const deleteVideoOnCloudinary = async(videoUrl)=>{
       
        try {
            const publicId = videoUrl.split("/")
            const Id = publicId[publicId.length - 1].replace(".mp4","")
            console.log(typeof Id,Id)
            const result = await cloudinary.uploader.destroy(Id,{
                resource_type : "video"
            })
            console.log(result)
            return result
        } catch (error) {
            throw new ApiError(501,"something went wrong while deleting video from cloudinary")
        }
    }
module.exports = {
    uploadProfileImageOnCloudinary,
    uploadVideoOnCloudinary,
    deleteVideoOnCloudinary
}