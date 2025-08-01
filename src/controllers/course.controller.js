const prisma = require("../utils/prismaClient");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { uploadFileToSupabse } = require("../utils/supabaseStorage");

// Create Course
const createCourse = asyncHandler(async (req, res) => {
  const { courseName, description, title, price, category } = req.body;
  const instructorId = req.user?.id;

  if (![courseName, description, price, category].every(Boolean)) {
    throw new ApiError(400, "All fields are required");
  }

  if (isNaN(price) || Number(price) < 0) {
    throw new ApiError(400, "Price must be a non-negative number");
  }

  const thumbnailPath = req.file?.path;
  if (!thumbnailPath) throw new ApiError(400, "Thumbnail image is required");

  const { publicUrl } = await uploadFileToSupabse("thumbnails", thumbnailPath);
  if (!publicUrl) throw new ApiError(500, "Thumbnail upload failed");

  const newCourse = await prisma.course.create({
    data: {
      title: title?.trim(),
      description: description.trim(),
      price: Number(price),
      category: category?.trim().toLowerCase(),
      thumbnail: publicUrl,
      instructorId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newCourse, "Course created successfully"));
});

// Update Course
const updateCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const instructorId = req.user?.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found");
  if (course.instructorId !== instructorId) {
    throw new ApiError(403, "Unauthorized to update this course");
  }

  const updateFields = {};
  const allowedFields = [
    "courseName",
    "title",
    "description",
    "price",
    "category",
  ];

  allowedFields.forEach((field) => {
    const value = req.body[field];
    if (value && value.trim() !== "") {
      const key = field === "courseName" ? "title" : field;
      updateFields[key] = field === "price" ? Number(value) : value.trim();
    }
  });

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: updateFields,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
});

// Update Thumbnail
const updateThumbnail = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const instructorId = req.user?.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found");
  if (course.instructorId !== instructorId) {
    throw new ApiError(403, "Not authorized to update this course");
  }

  const thumbnailPath = req.file?.path;
  const { publicUrl } = await uploadFileToSupabse("thumbnails", thumbnailPath);
  if (!publicUrl) throw new ApiError(500, "Thumbnail upload failed");

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: { thumbnail: publicUrl },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Thumbnail updated"));
});

// Get All Courses
const getAllCourse = asyncHandler(async (_req, res) => {
  const courses = await prisma.course.findMany({
    include: {
      instructor: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, courses, "Fetched all courses"));
});

// Get Course By ID
const getCourseById = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: true,
      lessons: {
        include: {
          videos: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) throw new ApiError(404, "Course not found");

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course details retrieved"));
});

// Get Courses by Category
const courseCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;
  if (!category || category.trim() === "") {
    throw new ApiError(400, "Category is required");
  }

  const courses = await prisma.course.findMany({
    where: {
      category: category.trim().toLowerCase(),
    },
    include: {
      instructor: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, courses, `${category} courses fetched`));
});

// List of Categories
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

// Get Free Courses
const freeCourses = asyncHandler(async (_req, res) => {
  const courses = await prisma.course.findMany({
    where: { price: 0 },
    orderBy: { createdAt: "desc" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, courses, "Free courses fetched"));
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
