const {Router} = require('express')
const router = Router()
const {createOrder,
    verifyPayment
} = require("../controllers/razorpayPayment.controller")
const {verifyJWT} = require('../middleware/auth.middleware')
router.route("/createOrder").post(createOrder)
router.route("/verifyPayment").post(verifyPayment)
module.exports = router