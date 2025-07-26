const{Router} = require("express")
const { verifyJWT } = require("../middleware/auth.middleware")
const upload = require("../middleware/multer.middleware")
const {
    createCourse,
    updateCourse,
    updateThumbnail,
    getAllCourse,
    getCourseById,
    courseCategory,
    listOfCourseCategory,
    freeCourses
} = require("../controllers/course.controller")
const router = Router()

router.route("/").get(courseCategory)
router.route('/listCategory').get(listOfCourseCategory)
router.route("/getFree").get(freeCourses)
router.route("/allCourses").get(getAllCourse)
router.route("/:courseId").get(getCourseById)

router.route("/createCourse").post(verifyJWT,upload.single("thumbnail"),createCourse)
router.route("/:courseId/updateCourse").post(verifyJWT,updateCourse)
router.route("/:courseId/updateThumbnail").post(verifyJWT,upload.single("thumbnail"),updateThumbnail)

module.exports = router