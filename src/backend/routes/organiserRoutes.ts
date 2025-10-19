// src/backend/routes/organiserRoutes.ts
import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getOrganizerEvents,
  getEventStats,
  getOrganizerDashboard,
  verifyTicket,
} from "../controllers/organiserDashboardController.js";

const router = Router();

router.get("/events", authenticate, authorizeRoles("organizer"), getOrganizerEvents);
router.get("/event/:eventId/stats", authenticate, authorizeRoles("organizer"), getEventStats);
router.post("/verify-ticket", authenticate, authorizeRoles("organizer"), verifyTicket);
router.get("/dashboard", authenticate, authorizeRoles("organizer"), getOrganizerDashboard);

export default router;
