// src/backend/routes/uploadRoutes.ts

import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  uploadFile,
  updateProfilePicture,
  multerMiddleware,
} from "../controllers/uploadController";

const router = Router();

// POST /api/upload/file → Upload any image/video
// @ts-ignore
router.post("/file", authenticate, multerMiddleware, uploadFile);

// PUT /api/upload/profile-picture → Update user profile pic
// @ts-ignore
router.put("/profile-picture", authenticate, multerMiddleware, updateProfilePicture);

export default router;
