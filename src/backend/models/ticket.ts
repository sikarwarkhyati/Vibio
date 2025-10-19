import mongoose, { Document, Schema } from "mongoose";

export interface ITicket extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  validated: boolean;
  ticketToken: string; // ✅ unique token for verification
  createdAt?: Date;
  updatedAt?: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    validated: { type: Boolean, default: false },
    ticketToken: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Ticket = mongoose.model<ITicket>("Ticket", ticketSchema);
export default Ticket;
