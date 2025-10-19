// src/backend/controllers/userDashboardController.ts

import { Response } from "express";
import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import { AuthRequest } from "../types/indexexpress.js";
// Define Max Tickets Per User (consistent with booking logic)
const MAX_TICKETS_PER_USER = 5; // Should ideally be moved to .env or config

/**
 * Get User Dashboard Summary: Booked Tickets & Profile
 * Access: User only
 */
export const getUserDashboard = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== "user") {
            return res.status(403).json({ message: "Access denied: User only" });
        }

        const userId = req.user._id;

        // 1. Get all tickets booked by the user (and populate the event details)
        const bookedTickets = await Ticket.find({ userId })
            .populate('eventId') // Assuming eventId is a ref to Event model
            .sort({ createdAt: -1 })
            .lean();

        // 2. Get count of distinct events booked
        const distinctEventIds = [...new Set(bookedTickets.map(t => t.eventId._id.toString()))];

        res.status(200).json({
            user: {
                id: userId,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
            },
            totalTicketsBooked: bookedTickets.length,
            eventsBooked: distinctEventIds.length,
            bookedTickets: bookedTickets.map(ticket => ({
                ticketId: ticket._id,
                ticketToken: ticket.ticketToken,
                validated: ticket.validated,
                eventTitle: (ticket.eventId as any).title || "Event Not Found",
                eventDate: (ticket.eventId as any).date,
            })),
        });
    } catch (err) {
        console.error("Get User Dashboard Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get Events Available for Booking (Excludes Events where user hit MAX_TICKETS_PER_USER)
 * Access: User only
 */
export const getAvailableEvents = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== "user") {
            return res.status(403).json({ message: "Access denied: User only" });
        }

        // Fetch all events
        const allEvents = await Event.find({}).sort({ date: 1 }).lean();

        // Check booked tickets count for each event asynchronously
        const availableEvents = await Promise.all(
            allEvents.map(async (event) => {
                const bookedCount = await Ticket.countDocuments({
                    eventId: event._id,
                    userId: req.user!._id,
                });

                const maxTickets = event.maxTickets || 1000; // Use event maxTickets if available

                return {
                    ...event,
                    ticketsBookedByUser: bookedCount,
                    ticketsRemainingForUser: Math.max(0, MAX_TICKETS_PER_USER - bookedCount),
                    isBookingAvailable: bookedCount < MAX_TICKETS_PER_USER && bookedCount < maxTickets,
                    eventCapacity: maxTickets,
                };
            })
        );

        res.status(200).json({ events: availableEvents });
    } catch (err) {
        console.error("Get Available Events Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};