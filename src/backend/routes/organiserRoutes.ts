// src/backend/routes/organiserRoutes.ts
import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import {
  getOrganizerEvents,
  getEventStats,
  getOrganizerDashboard,
  verifyTicket,
} from "../controllers/organiserDashboardController";

const router = Router();
// @ts-ignore
router.get("/events", authenticate, authorizeRoles("organizer"), getOrganizerEvents);
// @ts-ignore
router.get("/event/:eventId/stats", authenticate, authorizeRoles("organizer"), getEventStats);
// @ts-ignore
router.post("/verify-ticket", authenticate, authorizeRoles("organizer"), verifyTicket);
// @ts-ignore
router.get("/dashboard", authenticate, authorizeRoles("organizer"), getOrganizerDashboard);

export default router;
