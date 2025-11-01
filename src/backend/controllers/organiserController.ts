// src/backend/controllers/organizerController.ts
import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/users";
import Event from "../models/event";
import Ticket from "../models/ticket";
import { AuthRequest } from "../types/indexexpress";

// GET /api/organizers/:id/contact-info
export const getOrganizerContactInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. sanity check for Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    // 2. fetch organizer basic public info
    const organizer = await User.findById(id)
      .select("name email profilePicture role organizationId verified")
      .lean();

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // You can shape it however frontend expects:
    return res.status(200).json({
      id: organizer._id?.toString(),
      name: organizer.name,
      email: organizer.email,
      profilePicture: organizer.profilePicture || null,
      organizationId: organizer.organizationId || null,
      verified: organizer.verified || false,
      role: organizer.role,
    });
  } catch (err) {
    console.error("Get Organizer Contact Info Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/organizers/:id/stats
export const getOrganizerStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    // 2. find all events owned by this organizer
    const events = await Event.find({ organizerId: id }).select("_id").lean();
    const eventIds = events.map(e => e._id);

    // 3. count tickets for those events
    const tickets = await Ticket.find({ eventId: { $in: eventIds } }).lean();
    const totalBookings = tickets.length;

    // 4. compute stats
    const totalEvents = events.length;

    // we don't store price yet, so revenue can't be calculated properly
    const revenue = 0;

    // we don't have reviews yet in code you sent, so avgRating is placeholder
    const avgRating = 4.2;

    return res.status(200).json({
      totalEvents,
      totalBookings,
      revenue,
      avgRating,
    });
  } catch (err) {
    console.error("Get Organizer Stats Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
