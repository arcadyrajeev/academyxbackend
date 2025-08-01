const prisma = require("../utils/prismaClient");

const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

// Student Dashboard
const userEnrolledCourse = asyncHandler(async (req, res) => {
  const userId = req?.user?.id;
  if (!userId) throw new ApiError(401, "User is not logged in");

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId },
    select: { courseId: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      profileImage: true,
      fullname: true,
      bio: true,
      coverImage: true,
    },
  });

  if (!user) throw new ApiError(404, "User not found");

  if (!enrollments || enrollments.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, [user], "You have not enrolled in any courses")
      );
  }

  const courseIds = enrollments.map((e) => e.courseId);

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, [{ ...user, courses }], "Enrolled courses fetched")
    );
});

// Educator Dashboard
const educatorDashboard = asyncHandler(async (req, res) => {
  const userId = req?.user?.id;
  if (!userId) throw new ApiError(401, "User is not logged in");

  const courses = await prisma.course.findMany({
    where: { educatorId: userId },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        courses,
        courses.length ? "Courses fetched" : "No courses found."
      )
    );
});

module.exports = {
  userEnrolledCourse,
  educatorDashboard,
};
