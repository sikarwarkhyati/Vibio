// src/backend/models/event.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  createdBy: Types.ObjectId; // user who created
  organizerId: Types.ObjectId; // organizer of this event
  createdAt: Date;
  updatedAt: Date;
  maxTickets: number;
  images: string[];
  videos: string[];
}

const eventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    maxTickets: { type: Number, required: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },

  },
  { timestamps: true }
);

export default mongoose.model<IEvent>("Event", eventSchema);
