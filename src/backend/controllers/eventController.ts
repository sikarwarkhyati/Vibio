// src/backend/controllers/eventController.ts
import { Response } from "express";
import mongoose from "mongoose";
import Event, { IEvent } from "../models/event";
import { AuthRequest } from "../types/indexexpress";

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
    // Tell TS that this returns IEvent[]
    const events: IEvent[] = await Event.find().sort({ date: 1 });

    const transformed = events.map((ev: IEvent) => ({
      _id: (ev._id as any).toString(),
      title: ev.title,
      description: ev.description,
      date: ev.date,
      location: ev.location,
      venue: ev.location, // we don't store separate venue yet
      event_type: "general", // placeholder category
      price: 0, // we don't store ticket price yet
      available_seats: ev.maxTickets, // frontend calls this available_seats
      image_url: ev.images && ev.images.length > 0 ? ev.images[0] : undefined,
      organizer_id: ev.organizerId ? (ev.organizerId as any).toString() : undefined,
      created_at: ev.createdAt,
      popularity_score: 0, // placeholder for now
    }));

    return res.status(200).json({
      events: transformed,
      totalEvents: transformed.length,
    });
  } catch (err) {
    console.error("Get All Events Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- GET SINGLE EVENT (Public) -------------------
export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    // Frontend may still pass dummy IDs like "dummy-0001", not valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ev: IEvent | null = await Event.findById(eventId);
    if (!ev) {
      return res.status(404).json({ message: "Event not found" });
    }

    const transformed = {
      _id: (ev._id as any).toString(),
      title: ev.title,
      description: ev.description,
      date: ev.date,
      location: ev.location,
      venue: ev.location,
      event_type: "general",
      price: 0,
      available_seats: ev.maxTickets,
      image_url: ev.images && ev.images.length > 0 ? ev.images[0] : undefined,
      organizer_id: ev.organizerId ? (ev.organizerId as any).toString() : undefined,
      created_at: ev.createdAt,
      popularity_score: 0,
      images: ev.images,
    };

    return res.status(200).json(transformed);
  } catch (err) {
    console.error("Get Event By ID Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
