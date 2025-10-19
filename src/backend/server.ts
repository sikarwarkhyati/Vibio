// src/backend/server.ts
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";

// Import routes
import organizerRoutes from "./routes/organiserRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
app.use("/api/upload", uploadRoutes);


const PORT: number = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGO_URI: string = process.env.MONGO_URI!; // Guaranteed defined

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env!");
  process.exit(1);
}

// Mount routes
app.use("/api/organizer", organizerRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Connect to MongoDB and start server
(async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.DB_NAME || undefined,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();

// Global error handling to prevent nodemon silent crashes
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});
