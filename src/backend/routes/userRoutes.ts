// src/backend/routes/userRoutes.ts

import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import {
    getUserDashboard,
    getAvailableEvents,
} from "../controllers/userDashboardController.js";
import { bookTickets } from "../controllers/ticketBookingController.js"; // Import the booking controller

const router = Router();

// Routes for logged-in users
router.use(authenticate); // Apply authentication to all routes below

// GET /api/user/dashboard - User's main dashboard with profile and ticket list
router.get("/dashboard", authorizeRoles("user"), getUserDashboard);

// GET /api/user/events - List events available for user to book
router.get("/events", authorizeRoles("user"), getAvailableEvents);

// POST /api/user/book - Book tickets (uses the function you finalized earlier)
router.post("/book", authorizeRoles("user"), bookTickets);

export default router;