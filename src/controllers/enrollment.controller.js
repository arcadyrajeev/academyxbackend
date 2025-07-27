const { supabase } = require("../utils/supabaseClient");
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
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    throw new ApiError(404, "Course not found");
  }

  // Check if user is already enrolled
  const { data: existingEnrollment, error: enrollmentCheckError } =
    await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("student_id", userId)
      .single();

  if (enrollmentCheckError && enrollmentCheckError.code !== "PGRST116") {
    throw new ApiError(500, "Error checking enrollment");
  }

  // Unenroll
  if (existingEnrollment) {
    const { error: deleteError } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", existingEnrollment.id);

    if (deleteError) {
      throw new ApiError(500, "Unable to unenroll");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unenrolled successfully"));
  }

  // Enroll
  const { error: enrollError } = await supabase.from("enrollments").insert([
    {
      course_id: courseId,
      student_id: userId,
    },
  ]);

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

  const { data, error } = await supabase.rpc("get_popular_courses", {
    limit_value: limit,
  });

  if (error) {
    console.error("Supabase RPC Error:", error);
    throw new ApiError(500, "Failed to fetch popular courses");
  }

  if (!data || data.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No popular courses found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Popular courses fetched successfully"));
});

module.exports = {
  toggleEnrollment,
  getPopularCourses,
};
