// src/backend/routes/bookingRoutes.ts
import express from "express";
import {
  bookEvent,
  getUserBookings,
  cancelBooking,
} from "../controllers/bookingController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// all booking routes require a logged-in user
router.use(authenticate);

// POST /api/bookings  → create a booking + tickets
// @ts-ignore
router.post("/", bookEvent);

// GET /api/bookings/user/:userId  → list that user's bookings
// @ts-ignore
router.get("/user/:userId", getUserBookings);

// PATCH /api/bookings/:bookingId/cancel  → cancel booking
// @ts-ignore
router.patch("/:bookingId/cancel", cancelBooking);

export default router;
