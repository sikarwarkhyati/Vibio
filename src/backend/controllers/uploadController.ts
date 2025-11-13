// src/backend/controllers/uploadController.ts

import { Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import { AuthRequest } from "../types/indexexpress";
import User from "../models/users.js";
import { uploadFile as uploadToCloudinary } from "../services/cloudinaryService";

type SupportedMediaType = "image" | "video";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024; // 6 MB
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const determineMediaType = (mimetype: string): SupportedMediaType | null => {
  if (IMAGE_MIME_TYPES.has(mimetype)) return "image";
  if (VIDEO_MIME_TYPES.has(mimetype)) return "video";
  return null;
};

const validateIncomingFile = (
  file: Express.Multer.File | undefined
): { valid: boolean; type?: SupportedMediaType; errorMessage?: string } => {
  if (!file) {
    return { valid: false, errorMessage: "No file provided." };
  }

  const detectedType = determineMediaType(file.mimetype);
  if (!detectedType) {
    return { valid: false, errorMessage: "Invalid file type" };
  }

  const limit = detectedType === "image" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
  if (file.size > limit) {
    return { valid: false, errorMessage: "File too large" };
  }

  return { valid: true, type: detectedType };
};

// --- Multer memory storage (no saving to disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

export const multerMiddleware = upload.single("file");

/**
 * Upload file to Cloudinary (auto detect image/video)
 */
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateIncomingFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.errorMessage });
    }

    const file = req.file as Express.Multer.File;
    const fileType = validation.type as SupportedMediaType;
    const folder = fileType === "video" ? "uploads/videos" : "uploads/images";

    const uploadResult = await uploadToCloudinary({
      buffer: file.buffer,
      originalName: file.originalname || `${uuidv4()}-${fileType}`,
      mimetype: file.mimetype,
      folder,
      typeOverride: fileType,
    });

    if (!uploadResult.url || !uploadResult.public_id) {
      // If the helper could not reach Cloudinary, treat it as an error for the upload endpoint
      console.error(
        "Cloudinary Upload Error: No URL returned for %s (public_id: %s)",
        file.originalname,
        uploadResult.public_id ?? "<none>"
      );
      return res.status(500).json({ message: "Internal server error during upload" });
    }

    return res.status(200).json({
      url: uploadResult.url,
      public_id: uploadResult.public_id,
      type: fileType,
    });
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return res.status(500).json({ message: "Internal server error during upload" });
  }
};

/**
 * Update user's profile picture with Cloudinary URL
 */
export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image provided." });
    }

    // capture user id so TypeScript knows it's defined in closures
    const userId = req.user._id;

    // Upload to Cloudinary under profile-pictures folder
    const uploadResult = await uploadToCloudinary({
      buffer: file.buffer,
      originalName: file.originalname || `${userId}-${uuidv4()}`,
      mimetype: file.mimetype,
      folder: "profile-pictures",
      typeOverride: "image",
    });

    if (!uploadResult.url) {
      console.error(
        "Profile Picture Upload Error: Cloudinary returned no URL for %s",
        file.originalname
      );
      return res.status(500).json({ message: "Internal server error" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadResult.url },
      { new: true, select: "-password" }
    ).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: uploadResult.url,
      user,
    });
  } catch (err) {
    console.error("Profile Picture Update Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
