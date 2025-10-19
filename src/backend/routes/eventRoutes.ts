import express from "express";
import {
  createEvent,
  getOrganizerEvents,
  updateEvent,
  deleteEvent,
  getAllEvents,
} from "../controllers/eventController.js";
import { authenticate } from "../middleware/authMiddleware.js"; // JWT verification
import { authorizeRoles } from "../middleware/authMiddleware.js"; // Role-based access

const router = express.Router();

// ------------------- PUBLIC -------------------
router.get("/", getAllEvents); // Anyone can see all events

// ------------------- AUTHENTICATED USERS -------------------
router.use(authenticate); // All routes below require authentication

// Organizer routes
router.get("/organizer", authorizeRoles("organizer"), getOrganizerEvents);

// Admin routes
router.post("/", authorizeRoles("admin"), createEvent);
router.put("/:eventId", authorizeRoles("admin"), updateEvent);
router.delete("/:eventId", authorizeRoles("admin"), deleteEvent);

export default router;
