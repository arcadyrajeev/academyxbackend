const {mongoose,Schema} = require('mongoose')

const likeSchema = new Schema({
    course:{
        type:Schema.Types.ObjectId,
        ref:"Course"
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

const Like = mongoose.model("Like",likeSchema)
module.exports = Like