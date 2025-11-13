// src/backend/controllers/organiserController.ts
import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/users";
import Event from "../models/event";
import Ticket from "../models/ticket";
import Organization from "../models/organization";
import { AuthRequest } from "../types/indexexpress";

/**
 * GET /api/organizers/:id/contact-info
 * Public contact info for an organiser (defensive + typed)
 */
export const getOrganizerContactInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    // fetch organiser - use .lean() then cast to any because shape can vary across branches
    const organizer = (await User.findById(id)
      .select("name email profilePicture role organizationId verified")
      .lean()) as any;

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Fetch organisation name if present (defensive cast)
    let organizationName: string | null = null;
    let organizationIdValue: string | null = null;
    if (organizer.organizationId && mongoose.Types.ObjectId.isValid(String(organizer.organizationId))) {
      const organization = (await Organization.findById(String(organizer.organizationId))
        .select("name")
        .lean()) as any;
      organizationName = organization?.name ?? null;
      organizationIdValue = organization?._id?.toString() ?? String(organizer.organizationId) ?? null;
    }

    // shape the response safely
    return res.status(200).json({
      id: organizer._id ? String(organizer._id) : id,
      name: organizer.name ?? null,
      email: organizer.email ?? null,
      contact_email: organizer.email ?? null,
      profilePicture: organizer.profilePicture ?? null,
      organizationId: organizationIdValue,
      org_name: organizationName,
      verified: !!organizer.verified,
      role: organizer.role ?? "organizer",
    });
  } catch (err) {
    console.error("Get Organizer Contact Info Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/organizers/:id/stats
 * Basic aggregated stats for an organiser
 */
export const getOrganizerStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    // events owned by organizer
    const events = (await Event.find({ organizerId: id }).select("_id").lean()) as any[];
    const eventIds = events.map((e) => (e && e._id ? String(e._id) : null)).filter(Boolean);

    // tickets for those events
    const tickets = (await Ticket.find({ eventId: { $in: eventIds } }).lean()) as any[];
    const totalBookings = tickets.length;

    const totalEvents = events.length;
    const revenue = 0; // placeholder (depends on booking model)
    const avgRating = 4.2; // placeholder

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
