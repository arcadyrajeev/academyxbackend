const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { supabase } = require("../utils/supabaseClient");

// Student Dashboard
const userEnrolledCourse = asyncHandler(async (req, res) => {
  const userId = req?.user?.id; // assuming JWT middleware attaches it
  if (!userId) throw new ApiError(401, "User is not logged in");

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", userId);

  if (enrollmentError) throw new ApiError(500, enrollmentError.message);

  if (!enrollments || enrollments.length === 0) {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("username, email, profileImage, fullname, bio, coverImage")
      .eq("id", userId)
      .single();

    if (userError) throw new ApiError(500, userError.message);

    return res
      .status(200)
      .json(
        new ApiResponse(200, [user], "You have not enrolled in any courses")
      );
  }

  const courseIds = enrollments.map((e) => e.course_id);

  const { data: userWithCourses, error: userCoursesError } = await supabase
    .from("users")
    .select("username, email, profileImage, fullname, bio, coverImage")
    .eq("id", userId)
    .single();

  const { data: courses, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .in("id", courseIds);

  if (userCoursesError || courseError)
    throw new ApiError(500, userCoursesError?.message || courseError?.message);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        [{ ...userWithCourses, courses }],
        "Enrolled courses fetched"
      )
    );
});

// Educator Dashboard
const educatorDashboard = asyncHandler(async (req, res) => {
  const userId = req?.user?.id;
  if (!userId) throw new ApiError(401, "User is not logged in");

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, coverImage") // exclude content & educator if needed
    .eq("educator_id", userId);

  if (error) throw new ApiError(500, error.message);

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
