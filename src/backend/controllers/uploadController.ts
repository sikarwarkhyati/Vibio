// src/backend/controllers/uploadController.ts

import { Response } from "express";
import { AuthRequest } from "../types/indexexpress.js";
import User from "../models/users.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

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
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file provided." });
    }

    const fileType = file.mimetype.startsWith("video") ? "video" : "image";
    const folder = fileType === "video" ? "uploads/videos" : "uploads/images";

    // Upload buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: fileType,
          public_id: `${uuidv4()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    res.status(200).json({
      message: `${fileType} uploaded successfully`,
      result,
    });
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    res.status(500).json({ message: "Internal server error during upload" });
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
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "profile-pictures",
          resource_type: "image",
          public_id: `${userId}-${uuidv4()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: (result as any).secure_url },
      { new: true, select: "-password" }
    ).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: (result as any).secure_url,
      user,
    });
  } catch (err) {
    console.error("Profile Picture Update Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
