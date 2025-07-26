const {mongoose,Schema} = require("mongoose")

const enrollment = new Schema({
    course:{
        type: Schema.Types.ObjectId,
        ref:"Course",
        required:true
    },
    student:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},{timestamps:true})

const Enrollment = new mongoose.model("Enrollment",enrollment)
module.exports = Enrollment
