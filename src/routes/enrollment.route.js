const Router = require("express")
const { verifyJWT } = require("../middleware/auth.middleware")

const router = Router()
const{toggleEnrollment,getPopularCourses} = require("../controllers/enrollment.controller")
router.route("/popularCourses").get(getPopularCourses)
router.route("/:courseId").get(verifyJWT,toggleEnrollment)
module.exports = router