// src/backend/routes/eventRoutes.ts
import express from "express";
import {
  createEvent,
  getOrganizerEvents,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
} from "../controllers/eventController";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = express.Router();

// ------------------- PUBLIC -------------------
// Anyone can see all events
// @ts-ignore
router.get("/", getAllEvents);

// Single event details (public)
// @ts-ignore
router.get("/:eventId", getEventById);

// ------------------- AUTHENTICATED -------------------
// Below this line, JWT required
router.use(authenticate);

// Organizer: view their own events
// @ts-ignore
router.get(
  "/organizer",
  authorizeRoles("organizer", "admin", "superadmin"),
  getOrganizerEvents
);

// Admin-only management routes
// @ts-ignore
router.post("/", authorizeRoles("admin", "organizer", "superadmin"), createEvent);
// @ts-ignore
router.put(
  "/:eventId",
  authorizeRoles("admin", "organizer", "superadmin"),
  updateEvent
);
// @ts-ignore
router.delete(
  "/:eventId",
  authorizeRoles("admin", "organizer", "superadmin"),
  deleteEvent
);

export default router;
