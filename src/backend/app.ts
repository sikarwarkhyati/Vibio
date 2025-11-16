// src/backend/app.ts

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import organizerRoutes from "./routes/organiserRoutes";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import organizerPublicRoutes from "./routes/organizerPublicRoutes";
import superadminRoutes from "./routes/superadminRoutes";
import contactRoutes from "./routes/contactRoutes";


const app = express();

// basic middleware
app.use(cors());
app.use(express.json());

// mount ALL routes in one place
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/organizers", organizerPublicRoutes);
app.use("/api/organizers", organizerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/contact", contactRoutes);

// IMPORTANT: align with frontend expectations
// frontend is calling /api/users/... (plural), so we mount it that way
app.use("/api/users", userRoutes);

export default app;
