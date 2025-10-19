// src/backend/routes/uploadRoutes.ts

import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  uploadFile,
  updateProfilePicture,
  multerMiddleware,
} from "../controllers/uploadController.js";

const router = Router();

// POST /api/upload/file → Upload any image/video
router.post("/file", authenticate, multerMiddleware, uploadFile);

// PUT /api/upload/profile-picture → Update user profile pic
router.put("/profile-picture", authenticate, multerMiddleware, updateProfilePicture);

export default router;
