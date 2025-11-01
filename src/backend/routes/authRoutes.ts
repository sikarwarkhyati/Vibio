// src/backend/routes/authRoutes.ts
import express from "express";
import { signup, login, verifyEmail, getMe } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
// new:
router.get("/me", authenticate, getMe);

export default router;
