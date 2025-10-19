// src/backend/controllers/adminDashboardController.ts

import { Response } from "express";
import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import User from "../models/users.js";
import { AuthRequest } from "../types/indexexpress.js";
import mongoose from "mongoose";

/**
 * Get Admin Dashboard Overview (Global Statistics)
 * Access: Admin only
 */
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admin only" });
        }

        const totalUsers = await User.countDocuments({ role: "user" });
        const totalOrganizers = await User.countDocuments({ role: "organizer" });
        const totalAdmins = await User.countDocuments({ role: "admin" });
        const totalEvents = await Event.countDocuments({});
        const totalTicketsSold = await Ticket.countDocuments({});
        const totalTicketsValidated = await Ticket.countDocuments({ validated: true });

        res.status(200).json({
            stats: {
                totalUsers,
                totalOrganizers,
                totalAdmins,
                totalEvents,
                totalTicketsSold,
                totalTicketsValidated,
            },
            admin: {
                name: req.user.name,
                id: req.user._id,
            }
        });
    } catch (err) {
        console.error("Get Admin Dashboard Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get All Events (for Admin Oversight)
 * Access: Admin only
 */
export const getAllEventsAdmin = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admin only" });
        }

        // Fetch all events and populate the organizer details for display
        const events = await Event.find({})
            .populate("organizerId", "name email organizationId") // Fetch name, email from User model
            .sort({ date: -1 })
            .lean();

        res.status(200).json({ events });
    } catch (err) {
        console.error("Get All Events Admin Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get All Users (for Admin Management)
 * Access: Admin only
 */
export const getAllUsersAdmin = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admin only" });
        }

        // Fetch all users, excluding sensitive data
        const users = await User.find({})
            .select("-password -verificationToken -verificationTokenExpiry")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ users });
    } catch (err) {
        console.error("Get All Users Admin Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};