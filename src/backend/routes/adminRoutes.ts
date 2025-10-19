// src/backend/routes/adminRoutes.ts

import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import {
    getAdminDashboard,
    getAllEventsAdmin,
    getAllUsersAdmin,
} from "../controllers/adminDashboardController.js";

// Import the existing event CRUD functions, which also contain admin role checks internally.
import {
    updateEvent,
    deleteEvent,
} from "../controllers/eventController.js";

const router = Router();

// Apply authentication middleware to all routes in this router
router.use(authenticate, authorizeRoles("admin")); 

// Core Dashboard & Stats
router.get("/dashboard", getAdminDashboard);

// User Management (Admin Oversight)
router.get("/users", getAllUsersAdmin);

// Event Management (Admin Oversight)
router.get("/events", getAllEventsAdmin);
router.put("/events/:eventId", updateEvent); // Uses updateEvent from eventController
router.delete("/events/:eventId", deleteEvent); // Uses deleteEvent from eventController

export default router;