import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  bookedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  bookedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBooking>("Booking", BookingSchema);
