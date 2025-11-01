// src/backend/models/bookings.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  bookedAt: Date;
  totalTickets: number;
  status: "active" | "cancelled";
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    bookedAt: { type: Date, default: Date.now },
    totalTickets: { type: Number, required: true, default: 1 },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", BookingSchema);
