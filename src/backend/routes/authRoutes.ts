import express from "express";
import { signup, login, verifyEmail } from "../controllers/authController.js";

const router = express.Router();

// Auth routes
router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail); // email verification route

export default router;
