// src/backend/models/approvalRequest.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IApprovalRequest extends Document {
  requesterId: Types.ObjectId; // user id
  requesterRole: "admin" | "organizer";
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requesterRole: { type: String, enum: ["admin", "organizer"], required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export default (
  mongoose.models.ApprovalRequest ||
  mongoose.model<IApprovalRequest>("ApprovalRequest", ApprovalRequestSchema)
);
