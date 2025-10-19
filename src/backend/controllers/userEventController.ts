// src/backend/controllers/userEventController.ts
import { Response } from "express";
import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import { AuthRequest } from "../types/indexexpress.js";

const MAX_TICKETS_PER_USER = 5; // optional limit per event

export const getAvailableEventsForUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== "user")
      return res.status(403).json({ message: "Only users can view events" });

    // Fetch all events
    const events = await Event.find().sort({ date: 1 });

    // For each event, fetch how many tickets the user already booked
    const eventsWithTicketInfo = await Promise.all(
      events.map(async (event) => {
        const bookedCount = await Ticket.countDocuments({
          eventId: event._id,
          userId: req.user!._id,
        });

        return {
          ...event.toObject(),
          ticketsBooked: bookedCount,
          ticketsRemaining: MAX_TICKETS_PER_USER - bookedCount,
        };
      })
    );

    res.status(200).json(eventsWithTicketInfo);
  } catch (err) {
    console.error("Get Available Events Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
