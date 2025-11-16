// src/backend/routes/miscRoutes.ts
import { Router } from "express";
import { trackAnalytics } from "../controllers/analyticsController";
import { getUserProfile } from "../controllers/profileController";
import { getOrganizerContactInfo } from "../controllers/organiserController";

const router = Router();

// analytics (no auth required for now)
router.post("/analytics", trackAnalytics);

// user profile alias - matches frontend request /api/users/:userId/profile
router.get("/users/:userId/profile", getUserProfile);

// organizer contact info (matches frontend URL)
router.get("/organizers/:id/contact-info", getOrganizerContactInfo);

export default router;
