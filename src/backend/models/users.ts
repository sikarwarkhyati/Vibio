import mongoose, { Schema, Document, Types } from "mongoose";

// User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "organizer" | "admin";
  organizationId?: Types.ObjectId;
  verified: boolean;
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
  verificationTokenExpiry?: Date;
  profilePicture?: string;
}

// Schema
const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "organizer", "admin"], default: "user" },
    organizationId: { type: Schema.Types.ObjectId, ref: "User" },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    profilePicture: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
