import { Response } from "express";
import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import { AuthRequest } from "../types/indexexpress.js";
import { Types } from "mongoose";

export const getOrganizerEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "organizer") {
      return res.status(403).json({ message: "Access denied: Organizer only" });
    }

    const organizerId = req.user._id as string; // Safe cast
    const events = await Event.find({ organizerId: organizerId })
      .sort({ date: 1 })
      .lean();

    return res.status(200).json({ events });
  } catch (err) {
    console.error("Get Organizer Events Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getEventStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "organizer") {
      return res.status(403).json({ message: "Access denied: Organizer only" });
    }

    const { eventId } = req.params;
    const organizerId = req.user._id as string;

    const event = await Event.findOne({ _id: eventId, organizerId }).lean();
    if (!event) return res.status(404).json({ message: "Event not found or unauthorized" });

    const totalTickets = event.maxTickets ?? 0;
    const bookedTickets = await Ticket.countDocuments({ eventId });
    const validatedTickets = await Ticket.countDocuments({ eventId, validated: true });
    const remainingTickets = Math.max(0, totalTickets - bookedTickets);

    return res.status(200).json({
      eventId,
      title: event.title,
      totalTickets,
      bookedTickets,
      validatedTickets,
      remainingTickets,
    });
  } catch (err) {
    console.error("Get Event Stats Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "organizer") {
      return res.status(403).json({ message: "Access denied: Organizer only" });
    }

    const token = (req.body.ticketToken || req.body.token) as string | undefined;
    if (!token) return res.status(400).json({ message: "Ticket token is required" });

    const ticket = await Ticket.findOne({ ticketToken: token }).populate("eventId").exec();
    if (!ticket || !ticket.eventId) return res.status(404).json({ message: "Invalid ticket token" });

    const eventOwnerId = (ticket.eventId as any).organizerId?.toString();
    if (!eventOwnerId || eventOwnerId !== (req.user._id as string)) {
      return res.status(403).json({ message: "Not authorized to verify this ticket" });
    }

    if (ticket.validated) return res.status(200).json({ message: "Ticket already validated", ticket });

    ticket.validated = true;
    await ticket.save();

    return res.status(200).json({ message: "Ticket successfully verified", ticket });
  } catch (err) {
    console.error("Verify Ticket Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrganizerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "organizer") {
      return res.status(403).json({ message: "Access denied: Organizer only" });
    }

    const organizerId = req.user._id as string;
    const events = await Event.find({ organizerId }).sort({ date: 1 }).lean();

    const eventsWithStats = await Promise.all(
      events.map(async (event: any) => {
        const totalTickets = event.maxTickets ?? 0;
        const bookedTickets = await Ticket.countDocuments({ eventId: event._id });
        const validatedTickets = await Ticket.countDocuments({ eventId: event._id, validated: true });
        const remainingTickets = Math.max(0, totalTickets - bookedTickets);

        return {
          eventId: event._id,
          title: event.title,
          date: event.date,
          location: event.location,
          totalTickets,
          bookedTickets,
          validatedTickets,
          remainingTickets,
        };
      })
    );

    return res.status(200).json({ organizerId, events: eventsWithStats });
  } catch (err) {
    console.error("Get Organizer Dashboard Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
