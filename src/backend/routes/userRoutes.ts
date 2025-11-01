// src/backend/routes/userRoutes.ts

import { Router, Response } from "express";
import mongoose from "mongoose";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";
import {
  getUserDashboard,
  getAvailableEvents,
} from "../controllers/userDashboardController";
import { bookTickets } from "../controllers/ticketBookingController";
import User from "../models/users";
import { AuthRequest } from "../types/indexexpress";

const router = Router();

// All routes below here require a valid JWT
router.use(authenticate);

/**
 * GET /api/users/:userId/role
 * Returns { role: "user" | "organizer" | "admin" }
 * Used by frontend to decide dashboards / buttons / etc.
 *
 * Security rules:
 *  - normal users can only ask about themselves
 *  - admin can ask about anyone
 */
// @ts-ignore - middleware typing mismatch (AuthRequest vs Request)
router.get("/:userId/role", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // sanity check for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // enforce: only self OR admin
    const requester = req.user; // set by authenticate
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isSelf = requester._id?.toString?.() === userId;
    const isAdmin = requester.role === "admin";

    if (!isSelf && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: cannot view other user's role" });
    }

    const userDoc = await User.findById(userId).select("role").lean();
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ role: userDoc.role });
  } catch (err) {
    console.error("Error in GET /api/users/:userId/role:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/users/dashboard
 * User's own dashboard with profile + tickets, only for normal "user" role
 */
// @ts-ignore - middleware typing mismatch (AuthRequest vs Request)
router.get("/dashboard", authorizeRoles("user"), getUserDashboard);

/**
 * GET /api/users/events
 * List of events available to book, only for normal "user" role
 */
// @ts-ignore - middleware typing mismatch (AuthRequest vs Request)
router.get("/events", authorizeRoles("user"), getAvailableEvents);

/**
 * POST /api/users/book
 * Book tickets for an event. Only "user" role can do this.
 */
// @ts-ignore - middleware typing mismatch (AuthRequest vs Request)
router.post("/book", authorizeRoles("user"), bookTickets);

export default router;
