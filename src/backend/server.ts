// src/backend/server.ts
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app";

const PORT: number = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI missing in environment variables. Please update your .env file.");
}

const maskMongoUri = (uri: string) => {
  try {
    const parsed = new URL(uri);
    const host = parsed.host;
    const dbName = parsed.pathname.replace(/^\/+/, "") || "(default)";
    return `${parsed.protocol}//***:***@${host}/${dbName}`;
  } catch {
    return "mongodb+srv://***:***@<unknown>";
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log("✅ MongoDB connection established");
});

connection.on("reconnected", () => {
  console.log("🔁 MongoDB connection reestablished");
});

connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB connection lost. Mongoose will keep trying to reconnect.");
});

connection.on("error", (error) => {
  console.error("❌ MongoDB connection error:", error);
});

const connectWithRetry = async (attempt = 1): Promise<void> => {
  const maskedUri = maskMongoUri(MONGO_URI);
  console.log(`🔗 Connecting to MongoDB (attempt ${attempt}/${MAX_RETRIES}) → ${maskedUri}`);

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.DB_NAME || undefined,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected successfully on attempt ${attempt}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);

    if (attempt >= MAX_RETRIES) {
      console.error(
        `❌ Exhausted MongoDB retries after ${MAX_RETRIES} attempts for ${maskedUri}.`
      );
      throw new Error("Exceeded maximum MongoDB connection retries. Aborting startup.");
    }

    console.log(`⏳ Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await connectWithRetry(attempt + 1);
  }
};

(async () => {
  try {
    await connectWithRetry();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();

// Global crash safety (optional but helpful during dev)
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});
