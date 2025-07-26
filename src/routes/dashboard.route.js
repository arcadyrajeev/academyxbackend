const {Router} = require("express")
const { verifyJWT } = require("../middleware/auth.middleware")
const { 
    userEnrolledCourse,
    educatorDashboard

} = require("../controllers/dashboard.controller")
const router = Router()

router.route("/").get(verifyJWT,userEnrolledCourse)
router.route("/educator").get(verifyJWT,educatorDashboard)
module.exports = router
