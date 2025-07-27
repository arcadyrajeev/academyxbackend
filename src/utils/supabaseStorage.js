// supabaseStorage.js

const { supabase } = require("../config/supabaseClient");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const ApiError = require("../utils/apiError");

/**
 * Uploads a file buffer to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer from multer or other source
 * @param {string} bucket - Name of the Supabase bucket (e.g., "avatars", "course-covers")
 * @param {string} originalName - Original filename (used to preserve file extension)
 * @returns {string} public URL of uploaded file
 */
const uploadFileToSupabase = async (fileBuffer, bucket, originalName) => {
  try {
    const fileExt = path.extname(originalName);
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const filePath = `${bucket}/${uniqueFilename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, fileBuffer, {
        contentType: getMimeType(fileExt),
        upsert: false,
      });

    if (uploadError) throw new ApiError(500, uploadError.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(uniqueFilename);
    return data?.publicUrl;
  } catch (err) {
    throw new ApiError(500, err.message || "File upload failed");
  }
};

/**
 * Deletes a file from Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} path - Full file path in the bucket
 */
const deleteFileFromSupabase = async (bucket, path) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new ApiError(500, error.message);
  } catch (err) {
    throw new ApiError(500, err.message || "File deletion failed");
  }
};

const uploadVideoToSupabase = async (file) => {
  if (!file || !file.buffer || !file.originalname) {
    throw new ApiError(400, "Invalid video file");
  }

  return await uploadFileToSupabase(
    file.buffer,
    "course-videos",
    file.originalname
  );
};

/**
 * Helper to return a MIME type based on file extension
 */
function getMimeType(ext) {
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".pdf": "application/pdf",
  };
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

module.exports = {
  uploadFileToSupabase,
  deleteFileFromSupabase,
  uploadVideoToSupabase,
};
