const {mongoose,Schema} = require("mongoose")

const videoSchema = new Schema({
    videoTitle:{
        type:String,
        required:true,
        trim:true,
    },
    videoUrl:{
        type:String,
        required:true,
    }
})
const Video = mongoose.model("Video",videoSchema)
const lessonSchema = new Schema({
    course:{
        type: Schema.Types.ObjectId,
        ref:"Course",
        required:true,
    },
    title:{
        type:String,
        required:true,
        trim:true,
    },
    details:{
        type:String
    },
    video:[{
        type: Schema.Types.ObjectId, 
        ref:"Video"
    }]
})
const Lesson = mongoose.model("Lesson",lessonSchema)
module.exports = {
    Video,
    Lesson
}