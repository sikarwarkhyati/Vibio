// src/backend/models/organization.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  owners: Types.ObjectId[]; // user ids
  status: "active" | "suspended" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema<IOrganization> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    owners: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "suspended", "pending"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);
