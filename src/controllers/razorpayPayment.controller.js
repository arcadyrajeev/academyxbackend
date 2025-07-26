require('dotenv').config()
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler')
const razorpayInstance = require('../utils/razorpay')


const createOrder = asyncHandler(async (req,res)=>{
    let{courseId,amount} = req.body;

    
    const options={
        amount: amount*100,
        currency:"INR",
        receipt:`receipt_order_01`
    };
   
    try {
        const order = await razorpayInstance.orders.create(options)
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                order,
                "order is created"
            )
        )
    } catch (error) {
        console.error(error)
        return res
        .status(500)
        .json(
            new ApiResponse(
                500,
                {},
                error.description
            )
        )
    }


})

const verifyPayment = asyncHandler(async (req,res)=>{
    const{orderId, paymentId, signature} = req.body;
    
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const hmac = crypto.createHmac("sha256",secret);
    hmac.update(orderId+ "|" +paymentId)

    const generateSignature = hmac.digest("hex")
    if(generateSignature === signature){
        return res.status(200).json(
            new ApiResponse(200,{},"payment verified")
        )
    }else{
            return res.status(400)
            .json(
                new ApiResponse(400,{},"payment not verified")
            )
        }
})
module.exports = {
    createOrder,
    verifyPayment
}