import express from "express";
import { getUserBookings, cancelBooking } from "../controllers/bookingController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// must be logged in to see or cancel bookings
router.use(authenticate);

// GET /api/bookings/user/:userId
router.get("/user/:userId", getUserBookings);

// PATCH /api/bookings/:bookingId/cancel
router.patch("/:bookingId/cancel", cancelBooking);

export default router;
