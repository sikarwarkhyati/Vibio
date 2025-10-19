// src/backend/controllers/eventController.ts
import { Response } from "express";
import mongoose from "mongoose";
import Event, { IEvent } from "../models/event.js";
import { AuthRequest } from "../types/indexexpress.js";

// ------------------- CREATE EVENT (Admin Only) -------------------
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admin can create events" });

    // Destructure body and include images
    const { title, description, date, location, maxTickets, images } = req.body;

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      organizerId: req.user._id, // assign creator
      maxTickets, // allow organizer to set max tickets
      images: images || [], // <-- added images support
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created", event: newEvent });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- GET EVENTS FOR ORGANIZER -------------------
export const getOrganizerEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const events = await Event.find({ organizerId: req.user._id }).sort({ date: 1 });
    res.status(200).json(events);
  } catch (err) {
    console.error("Get Organizer Events Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- UPDATE EVENT (Admin Only) -------------------
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admin can update events" });

    const { eventId } = req.params;
    // Destructure body and include images
    const { title, description, date, location, maxTickets, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { title, description, date, location, maxTickets, images: images || [] }, // <-- added images support
      { new: true, runValidators: true }
    );

    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event updated", event: updatedEvent });
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- DELETE EVENT (Admin Only) -------------------
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admin can delete events" });

    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    const deleted = await Event.deleteOne({ _id: eventId });

    if (deleted.deletedCount === 0)
      return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    console.error("Delete Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- GET ALL EVENTS (Public) -------------------
export const getAllEvents = async (_req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (err) {
    console.error("Get All Events Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
