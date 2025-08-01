// src/controllers/lessons.controller.js
import prisma from "../utils/prismaClient.js";
import { uploadVideoToSupabase } from "../utils/supabaseStorage.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const createLesson = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { lessonTitle, details, videoTitle } = req.body;
  const file = req.file;

  if (!lessonTitle || !videoTitle || !file) {
    throw new ApiError(
      400,
      "lessonTitle, videoTitle, and video file are required"
    );
  }

  // Check if course exists and educator owns it
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) throw new ApiError(404, "Course not found");
  if (course.instructorId !== req.user.id)
    throw new ApiError(403, "Unauthorized");

  // Upload video
  const videoUpload = await uploadVideoToSupabase(file);
  if (!videoUpload?.publicUrl) throw new ApiError(500, "Video upload failed");

  // Get current lesson count to determine order
  const lessonCount = await prisma.lesson.count({
    where: { courseId },
  });

  // Create lesson with video
  const lesson = await prisma.lesson.create({
    data: {
      title: lessonTitle,
      content: details || "",
      order: lessonCount + 1,
      course: { connect: { id: courseId } },
      videos: {
        create: {
          title: videoTitle,
          videourl: videoUpload.publicUrl,
          order: 1,
        },
      },
    },
    include: {
      videos: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, lesson, "Lesson created successfully"));
});

const getLessonsByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    include: { videos: true },
    orderBy: { order: "asc" },
  });

  if (!lessons.length) {
    throw new ApiError(404, "No lessons found for this course");
  }

  res
    .status(200)
    .json(new ApiResponse(200, lessons, "Lessons fetched successfully"));
});

const addVideoLesson = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { videoTitle } = req.body;
  const file = req.file;

  if (!videoTitle || !file) {
    throw new ApiError(400, "video title and video are required");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) throw new ApiError(404, "course not found");

  const lesson = await prisma.lesson.findUnique({
    where: { courseId: courseId, id: lessonId },
  });

  if (!lesson) throw new ApiError(404, "lesson not found");

  const videUpload = await uploadVideoToSupabase(file);
  if (!videoUpload?.publicUrl) throw new ApiError(500, "Video upload failed");

  const videoCount = await prisma.video.count({
    where: { lessonId },
  });

  const newVideo = await prisma.video.create({
    data: {
      title: videoTitle,
      videourl: videUpload.publicUrl,
      order: videoCount + 1,
      lesson: { connect: { id, lessonId } },
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video added to lesson"));
});

const editLesson = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { lessonTitle, details } = req.body;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course || course.instructorId !== req.user.id)
    throw new ApiError(404, "unauthorized or Course not found");

  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: lessonTitle,
      content: details,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedLesson, "Lesson updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { courseId, lessonId, videoId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course || course.instructorId !== req.user.id) {
    throw new ApiError(403, "Unauthorized or course not found");
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new ApiError(404, "Video not found");

  await prisma.video.delete({
    where: { id: videoId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const deleteLessonById = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course || course.instructorId !== req.user.id) {
    throw new ApiError(403, "Unauthorized or course not found");
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });

  if (!lesson) throw new ApiError(404, "Lesson not found");

  await prisma.lesson.delete({
    where: { id: lessonId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Lesson deleted successfully"));
});

export {
  createLesson,
  getLessonsByCourse,
  addVideoLesson,
  editLesson,
  deleteVideo,
  deleteLessonById,
};
