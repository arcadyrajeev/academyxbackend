// src/controllers/lessons.controller.js

import { supabase } from "../utils/supabaseClient.js";
import {
  uploadVideoToSupabase,
  deleteVideoFromSupabase,
} from "../utils/supabaseStorage.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

export const createLesson = asyncHandler(async (req, res) => {
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
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (courseErr || !course) throw new ApiError(404, "Course not found");
  if (course.educator_id !== req.user.id)
    throw new ApiError(403, "Unauthorized");

  // Upload video
  const videoUpload = await uploadVideoToSupabase(file);
  if (!videoUpload?.publicUrl) throw new ApiError(500, "Video upload failed");

  // Insert video record
  const { data: video, error: videoErr } = await supabase
    .from("videos")
    .insert({ title: videoTitle, url: videoUpload.publicUrl })
    .select()
    .single();

  if (videoErr) throw new ApiError(500, "Video record creation failed");

  // Create lesson
  const { data: lesson, error: lessonErr } = await supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      title: lessonTitle,
      details: details || "",
      video_ids: [video.id],
    })
    .select()
    .single();

  if (lessonErr) throw new ApiError(500, "Lesson creation failed");

  return res
    .status(200)
    .json(new ApiResponse(200, lesson, "Lesson created successfully"));
});

// Other methods (addVideoLesson, editLesson, deleteLessonById...) will follow the same structure
// and be migrated similarly using supabaseClient and supabaseStorage

// Export all handlers in one place like before
export default {
  createLesson,
  // addVideoLesson,
  // editLesson,
  // deleteLessonById,
  // deleteVideo,
  // getLessonsByCourse,
};
