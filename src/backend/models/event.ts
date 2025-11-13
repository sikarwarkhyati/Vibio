// src/backend/models/event.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type EventMediaType = "image" | "video";

export interface IEventMediaItem {
  url: string;
  public_id?: string | null;
  type: EventMediaType;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  createdBy: Types.ObjectId; // user who created
  organizerId: Types.ObjectId; // organizer of this event
  organizationId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  maxTickets: number;
  images: string[];
  videos: string[];
  media?: IEventMediaItem[];
}

const eventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
    maxTickets: { type: Number, required: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    media: {
      type: [
        {
          url: { type: String, required: true },
          public_id: { type: String },
          type: { type: String, enum: ["image", "video"], required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>("Event", eventSchema);
