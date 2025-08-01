const { prisma } = require("../utils/prismaClient");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Toggle enrollment: enroll or unenroll
const toggleEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req?.user?.id;

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  // Check if course exists

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (courseError || !course) {
    throw new ApiError(404, "Cour se not found");
  }

  // Check if user is already enrolled

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { courseId, studentId: userId },
  });

  if (enrollmentCheckError && enrollmentCheckError.code !== "PGRST116") {
    throw new ApiError(500, "Error checking enrollment");
  }

  // Unenroll
  if (existingEnrollment) {
    await prisma.enrollment.delete({
      where: { id: existingEnrollment.id },
    });

    if (deleteError) {
      throw new ApiError(500, "Unable to unenroll");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unenrolled successfully"));
  }

  // Enroll

  await prisma.enrollment.create({
    data: {
      courseId,
      studentId: userId,
    },
  });

  if (enrollError) {
    throw new ApiError(500, "Unable to enroll right now");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully enrolled"));
});

// Get popular courses by enrollment count
const getPopularCourses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const popularCourses = await prisma.course.findMany({
    take: limit,
    orderBy: {
      enrollments: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
  });

  if (!popularCourses.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No popular courses found"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      popularCourses.map((c) => ({
        ...c,
        enrollmentCount: c._count.enrollments,
      })),
      "Popular courses fetched successfully"
    )
  );
});

module.exports = {
  toggleEnrollment,
  getPopularCourses,
};
