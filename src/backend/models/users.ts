// src/backend/models/users.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type RoleType = "user" | "organizer" | "admin" | "superadmin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: RoleType;
  organizationId?: Types.ObjectId | null;
  approved?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  verified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "organizer", "admin", "superadmin"],
      default: "user",
    },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
    approved: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    profilePicture: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);
