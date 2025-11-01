// src/backend/controllers/bookingController.ts
import { Response } from "express";
import mongoose from "mongoose";
import Booking from "../models/bookings";
import Event from "../models/event";
import Ticket from "../models/ticket";
import crypto from "crypto";
import { AuthRequest } from "../types/indexexpress";

//
// POST /api/bookings
// Body: { eventId: string, quantity?: number }
// Creates a booking for the logged-in user + generates tickets
//
export const bookEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { eventId, quantity } = req.body;
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // 1. Load the event
    const ev = await Event.findById(eventId);
    if (!ev) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2. Check capacity
    const bookedCount = await Ticket.countDocuments({ eventId });
    const remaining = (ev.maxTickets ?? 0) - bookedCount;
    if (remaining <= 0) {
      return res.status(400).json({ message: "Event is fully booked" });
    }
    if (qty > remaining) {
      return res.status(400).json({
        message: `Only ${remaining} tickets left`,
      });
    }

    // 3. Create a Booking doc
    const newBooking = await Booking.create({
      userId: req.user._id,
      eventId: ev._id,
      totalTickets: qty,
      status: "active",
      bookedAt: new Date(),
    });

    // 4. Generate tickets for this booking
    // We don't have price in Event yet, so default 0
    const ticketsToInsert = Array.from({ length: qty }).map(() => ({
      eventId: ev._id,
      userId: req.user!._id,
      validated: false,
      price: 0,
      ticketToken: crypto.randomBytes(16).toString("hex"), // unique code
    }));


    // Cast so TS stops whining
    const createdTickets = (await Ticket.insertMany(ticketsToInsert)) as any[];
    // 5. Respond
    return res.status(201).json({
      message: "Booking successful",
      booking: {
        _id: newBooking._id.toString(),
        status: newBooking.status,
        totalTickets: newBooking.totalTickets,
        created_at: newBooking.bookedAt,
      },
      tickets: createdTickets.map((t) => ({
        _id: t._id.toString(),
        token: t.ticketToken,
        validated: t.validated,
        price: t.price,
      })),
    });
  } catch (err) {
    console.error("bookEvent Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


//
// GET /api/bookings/user/:userId
//
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // auth check
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

    // 1. All bookings by this user
    const bookings = await Booking.find({ userId })
      .sort({ bookedAt: -1 })
      .lean();

    // 2. Events referenced by those bookings
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

    // 3. Tickets for those bookings (by user+event)
    const tickets = await Ticket.find({
      userId: userId,
      eventId: { $in: eventIds },
    })
      .lean()
      .exec();

    // group tickets by eventId so we can attach a "ticket_code"
    const ticketsByEvent: Record<string, any[]> = {};
    tickets.forEach((t) => {
      const key = t.eventId.toString();
      if (!ticketsByEvent[key]) ticketsByEvent[key] = [];
      ticketsByEvent[key].push(t);
    });

    // 4. Final transform for frontend
    const responseBookings = bookings.map((b) => {
      const ev = eventsById[b.eventId.toString()];

      // pick first ticket's token as "ticket_code"
      const firstTicket = (ticketsByEvent[b.eventId.toString()] || [])[0];
      const ticketCode = firstTicket ? firstTicket.ticketToken : "N/A";

      return {
        _id: b._id.toString(),
        ticket_code: ticketCode,
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
              price: 0, // no pricing yet
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


//
// PATCH /api/bookings/:bookingId/cancel
//
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
