const mongoose = require("mongoose")
const DB_NAME = require("../constants.js")
require("dotenv").config()


const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log("data connected",connectionInstance.connection.host)
    } catch (error) {
        console.error("error: mongoDB connection failed",error)
        process.exit(1)
    }
}
module.exports = connectDB