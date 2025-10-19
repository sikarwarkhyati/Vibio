import { Response } from "express";
import crypto from "crypto";
import Ticket from "../models/ticket.js";
import Event, { IEvent } from "../models/event.js";
import Booking from "../models/bookings.js";
import { AuthRequest } from "../types/indexexpress.js";

export const bookTickets = async (req: AuthRequest, res: Response) => {
  try {
    // 1️⃣ Authentication & Role Check
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== "user") return res.status(403).json({ message: "Only users can book tickets" });

    const { eventId, quantity } = req.body;

    if (!quantity || quantity < 1)
      return res.status(400).json({ message: "Invalid ticket quantity" });

    // 2️⃣ Validate Event
    const event: IEvent | null = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 3️⃣ Check Availability (organizer-defined)
    const MAX_TICKETS_PER_EVENT = event.maxTickets ?? 100;
    const MAX_TICKETS_PER_USER = 5;

    const totalTicketsBooked = await Ticket.countDocuments({ eventId });
    if (totalTicketsBooked + quantity > MAX_TICKETS_PER_EVENT) {
      return res.status(400).json({
        message: `Cannot book ${quantity} tickets. Only ${MAX_TICKETS_PER_EVENT - totalTicketsBooked} tickets left.`,
      });
    }

    const userTicketsCount = await Ticket.countDocuments({
      eventId,
      userId: req.user._id,
    });

    if (userTicketsCount + quantity > MAX_TICKETS_PER_USER) {
      return res.status(400).json({
        message: `Cannot book ${quantity} tickets. You can book maximum ${MAX_TICKETS_PER_USER} tickets per event.`,
      });
    }

    // 4️⃣ Create Tickets with Unique Tokens
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const token = crypto.randomBytes(16).toString("hex");
      tickets.push(
        new Ticket({
          eventId,
          userId: req.user._id,
          validated: false,
          ticketToken: token, // 🧩 new field
        })
      );
    }

    await Ticket.insertMany(tickets);

    // 5️⃣ Create Booking Record
    const booking = new Booking({
      eventId,
      userId: req.user._id,
      bookedAt: new Date(),
      totalTickets: quantity,
    });
    await booking.save();

    // 6️⃣ Respond to Frontend (safe data only)
    res.status(201).json({
      message: `Successfully booked ${quantity} ticket(s) for the event.`,
      totalTicketsForUser: userTicketsCount + quantity,
      totalTicketsForEvent: totalTicketsBooked + quantity,
      tickets: tickets.map((t) => ({
        token: t.ticketToken,
        validated: t.validated,
      })),
      booking,
    });
  } catch (err) {
    console.error("Book Tickets Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
