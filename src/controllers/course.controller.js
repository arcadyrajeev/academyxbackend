// Required Imports
const { supabase } = require("../utils/supabaseClient");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { uploadFileToSupabse } = require("../utils/supabaseStorage");

const createCourse = asyncHandler(async (req, res) => {
  const {
    courseName,
    description,
    title,
    price,
    duration,
    category,
    taqs = [],
  } = req.body;

  if (
    [courseName, description, price, duration, category].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (isNaN(price) || Number(price) < 0) {
    throw new ApiError(400, "Price must be a non-negative number");
  }

  const thumbnailPath = req.file?.path;
  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail image is required");
  }

  if (!Array.isArray(taqs) || taqs.length > 10) {
    throw new ApiError(400, "Taqs must be an array of at most 10 items");
  }

  const response = await uploadFileToSupabse("thumbnails", thumbnailPath);
  if (!response?.publicUrl) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  const { data: course, error } = await supabase
    .from("courses")
    .insert([
      {
        course_name: courseName.trim(),
        description: description.trim(),
        title: title?.trim(),
        price: Number(price),
        duration: duration?.trim(),
        category: category?.trim().toLowerCase(),
        thumbnail: response.publicUrl,
        educator_id: req.user?.id,
        taqs: taqs.map((tag) => tag.trim().toLowerCase()),
      },
    ])
    .select("*")
    .single();

  if (error || !course) throw new ApiError(500, "Failed to create course");

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course created successfully"));
});

const updateCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (error || !course) throw new ApiError(404, "Course not found");

  if (course.educator_id !== req.user?.id) {
    throw new ApiError(403, "You are not the course owner");
  }

  const allowedFields = [
    "courseName",
    "title",
    "description",
    "price",
    "duration",
    "category",
  ];
  const updateFields = {};

  allowedFields.forEach((field) => {
    const value = req.body[field];
    if (value && value.trim() !== "") {
      if (field === "price" && Number(value) < 0) {
        throw new ApiError(400, "Price cannot be negative");
      }
      const dbField =
        field === "courseName" ? "course_name" : field.toLowerCase();
      updateFields[dbField] = field === "price" ? Number(value) : value.trim();
    }
  });

  const { data: updatedCourse, error: updateError } = await supabase
    .from("courses")
    .update(updateFields)
    .eq("id", courseId)
    .select("*")
    .single();

  if (updateError || !updatedCourse)
    throw new ApiError(500, "Course update failed");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
});

const updateThumbnail = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const thumbnailPath = req.file?.path;

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (error || !course) throw new ApiError(404, "Course not found");
  if (course.educator_id !== req.user?.id) {
    throw new ApiError(403, "Not authorized to update this course");
  }

  const response = await uploadFileToSupabse("thumbnails", thumbnailPath);
  if (!response?.publicUrl) throw new ApiError(500, "Thumbnail upload failed");

  const { data: updatedCourse, error: updateError } = await supabase
    .from("courses")
    .update({ thumbnail: response.publicUrl })
    .eq("id", courseId)
    .select("*")
    .single();

  if (updateError) throw new ApiError(500, "Thumbnail update failed");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Thumbnail updated"));
});

const getAllCourse = asyncHandler(async (req, res) => {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*, educators(username, profile_image)");

  if (error) throw new ApiError(500, "Error fetching courses");

  return res
    .status(200)
    .json(new ApiResponse(200, courses, "Fetched all courses"));
});

const getCourseById = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const { data: course, error } = await supabase
    .from("courses")
    .select("*, content(*, video(videoTitle, videoUrl)), educators(*)")
    .eq("id", courseId)
    .single();

  if (error || !course) throw new ApiError(502, "Error fetching course");

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course details retrieved"));
});

const courseCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;

  if (!category || category.trim() === "") {
    throw new ApiError(400, "Category is required");
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select("*, educators(profile_image, username)")
    .eq("category", category.trim().toLowerCase());

  if (error) throw new ApiError(404, "Error fetching category courses");

  return res
    .status(200)
    .json(new ApiResponse(200, courses, `${category} courses fetched`));
});

const listOfCourseCategory = asyncHandler(async (_req, res) => {
  const categories = [
    "Artificial Intelligence",
    "Web Development",
    "App Development",
    "Software Development",
    "Language",
    "Game Development",
    "Programming Languages",
    "Graphic Design",
    "UI/UX Design",
    "Video Editing",
    "Cybersecurity",
    "Cloud Computing",
    "Data Science",
    "DevOps",
    "Digital Marketing",
    "Blockchain Technology",
  ];
  return res.status(200).json({ categories });
});

const freeCourses = asyncHandler(async (_req, res) => {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("price", 0);

  if (error) throw new ApiError(500, "Error fetching free courses");

  return res.status(200).json(new ApiResponse(200, courses, "Free courses"));
});

module.exports = {
  createCourse,
  updateCourse,
  updateThumbnail,
  getAllCourse,
  getCourseById,
  courseCategory,
  listOfCourseCategory,
  freeCourses,
};
