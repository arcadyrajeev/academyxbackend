const {mongoose,Schema} = require("mongoose")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        trim:true,

    },
    bio:{
        type:String,

    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    profileImage:{
        type:String, // image url
    },
    coverImage:{
        type:String,
    },
    password:{
        type:String,
        required:[true,"password is required"],

    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
})

userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign({
        _id:this._id,
        username: this.username,
        email:this.email,
        password:this.password
      }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE });
}
userSchema.methods.generateAccessToken = async function(){
    return jwt.sign({
        _id:this._id,
      }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
}
const User = mongoose.model("User",userSchema)
module.exports = User