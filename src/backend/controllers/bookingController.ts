import { Response } from "express";
import mongoose from "mongoose";
import Booking from "../models/bookings";
import Event from "../models/event";
import { AuthRequest } from "../types/indexexpress";

// GET /api/bookings/user/:userId
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // auth check: you can only view your own bookings unless you're admin
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // pull bookings by that user
    const bookings = await Booking.find({ userId })
      .sort({ bookedAt: -1 })
      .lean();

    // fetch the events for each booking
    const eventIds = bookings.map((b) => b.eventId);
    const eventsById = await Event.find({ _id: { $in: eventIds } })
      .lean()
      .then((evts) => {
        const map: Record<string, any> = {};
        evts.forEach((ev) => {
          map[ev._id.toString()] = ev;
        });
        return map;
      });

    // transform into frontend shape
    const responseBookings = bookings.map((b) => {
      const ev = eventsById[b.eventId.toString()];
      return {
        _id: b._id.toString(),
        ticket_code: "N/A", // we don't yet store one code per booking, only per ticket
        status: b.status || "active",
        created_at: b.bookedAt,
        user_id: b.userId.toString(),
        event: ev
          ? {
              _id: ev._id.toString(),
              title: ev.title,
              description: ev.description,
              date: ev.date,
              location: ev.location,
              venue: ev.location,
              event_type: "general",
              image_url:
                ev.images && ev.images.length > 0 ? ev.images[0] : undefined,
              price: 0, // we don't track price yet
            }
          : null,
      };
    });

    return res.status(200).json({
      bookings: responseBookings,
    });
  } catch (err) {
    console.error("getUserBookings Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/bookings/:bookingId/cancel
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only the user who booked OR an admin can cancel
    if (
      req.user.role !== "admin" &&
      booking.userId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not allowed to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.status(200).json({
      message: "Booking cancelled",
      booking: {
        _id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (err) {
    console.error("cancelBooking Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
