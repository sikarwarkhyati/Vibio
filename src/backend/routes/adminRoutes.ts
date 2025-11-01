// src/backend/routes/adminRoutes.ts

import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import {
  getAdminDashboard,
  getAllEventsAdmin,
  getAllUsersAdmin,
} from "../controllers/adminDashboardController";
import { updateEvent, deleteEvent } from "../controllers/eventController";

const router = Router();

// 1️⃣ Restrict all routes to authenticated admins
router.use(authenticate);
// @ts-ignore - same mismatch between AuthRequest and Express.Request
router.use(authorizeRoles("admin"));

// 2️⃣ Admin dashboard (global stats)
// @ts-ignore - AuthRequest typing mismatch
router.get("/dashboard", getAdminDashboard);

// 3️⃣ Admin: view all users
// @ts-ignore - AuthRequest typing mismatch
router.get("/users", getAllUsersAdmin);

// 4️⃣ Admin: event management
// @ts-ignore - AuthRequest typing mismatch
router.get("/events", getAllEventsAdmin);

// @ts-ignore - AuthRequest typing mismatch
router.put("/events/:eventId", updateEvent);

// @ts-ignore - AuthRequest typing mismatch
router.delete("/events/:eventId", deleteEvent);

export default router;
