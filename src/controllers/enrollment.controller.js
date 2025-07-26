const Course = require("../models/course.model")
const Enrollment = require("../models/enrollment.model")

const ApiError = require("../utils/apiError")
const ApiResponse = require("../utils/apiResponse")
const asyncHandler = require("../utils/asyncHandler")
const {mongoose, isValidObjectId} = require("mongoose")



const toggleEnrollment = asyncHandler(async(req,res)=>{
    const{courseId} = req.params
    if(!isValidObjectId(courseId)){ 
            throw new ApiError(401,"Invalid course Id")
        }
    //checking course is present or not
    const course = await Course.findById(new mongoose.Types.ObjectId(courseId))
    if(!course){
        throw new ApiError(404,"Course not found")
    }

    //check student enrolled or not
    const isEnrolled = await Enrollment.findOne(
        {
            course:new mongoose.Types.ObjectId(courseId),
            student:req?.user._id

        }
    )
    if(isEnrolled){

        const unEnrolled = await Enrollment.findOneAndDelete(
            {
                course: new mongoose.Types.ObjectId(courseId),
                student: req?.user._id
            }
        )
        if(!unEnrolled){
            throw new ApiError(500,"unable to unenrolled!")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Unenrolled successfully")
        )

    }else{
        const enroll = await Enrollment.create({
            course: new mongoose.Types.ObjectId(courseId),
            student: req?.user._id
        })
        if(!enroll){
            throw new ApiError(500,"unable to enroll right now")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Successfully enrolled ")
        )
    }
})
const getPopularCourses = asyncHandler(async (req, res) => {
    
    const { limit = 20 } = req.query; // Optional limit parameter, default is 20

    const popularCourses = await Enrollment.aggregate([
        {
            $group: {
                _id: "$course", // Group by course ID
                totalEnrollments: { $sum: 1 } // Count the number of enrollments for each course
            }
        },
        {
            $sort: { totalEnrollments: -1 } // Sort by total enrollments in descending order
        },
        {
            $limit: parseInt(limit) // Limit the number of results
        },
        {
            $lookup: {
                from: "courses", // Join with the Course collection
                localField: "_id", // The course ID from the Enrollment collection
                foreignField: "_id", // The course ID in the Course collection
                as: "courseDetails"
            }
        },
        {
            $unwind: "$courseDetails" // Flatten the courseDetails array
        },
        {
            $lookup: {
                from: "users", // Join with the User collection to get educator details
                localField: "courseDetails.educator",
                foreignField: "_id",
                as: "educatorDetails"
            }
        },
        {
            $unwind: "$educatorDetails" // Flatten the educatorDetails array
        },
        {
            $project: {
                _id: 0, // Exclude the default _id field
                courseName: "$courseDetails.courseName",
                description: "$courseDetails.description",
                price: "$courseDetails.price",
                thumbnail: "$courseDetails.thumbnail",
                category: "$courseDetails.category",
                totalEnrollments: 1,
                "educator.username": "$educatorDetails.username",
                "educator.profileImage": "$educatorDetails.profileImage"
            }
        }
    ]);

    if (!popularCourses || popularCourses.length === 0) {
        return res.status(404).json(
            new ApiResponse(404, {}, "No popular courses found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, popularCourses, "Popular courses fetched successfully")
    );
});
module.exports = {
    toggleEnrollment,
    getPopularCourses
}