import { Response } from "express";
import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import { AuthRequest } from "../types/indexexpress.js";

export const validateTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const userId = req.user._id as string; // Safe cast
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Ticket token required" });

    const ticket = await Ticket.findOne({ ticketToken: token });
    if (!ticket) return res.status(404).json({ message: "Invalid ticket token" });

    const event = await Event.findById(ticket.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      req.user.role !== "organizer" &&
      req.user.role !== "admin" &&
      event.organizerId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to validate this ticket" });
    }

    if (ticket.validated) return res.status(400).json({ message: "Ticket already validated" });

    ticket.validated = true;
    await ticket.save();

    res.status(200).json({ message: "Ticket validated successfully", ticket });
  } catch (err) {
    console.error("Validate Ticket Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
