// src/backend/types/indexexpress.ts
import { Request } from "express";
import { Types } from "mongoose";

// This is what we ACTUALLY attach in authMiddleware after verifying the JWT.
// Keep it lightweight and stringly-typed so controllers don't fight with ObjectId.
export interface AuthUser {
  _id: Types.ObjectId;         // real Mongo id
  id: string;                  // string version for convenience
  name: string;
  email: string;
  role: "user" | "organizer" | "admin" | "superadmin";
  organizationId?: Types.ObjectId;
  verified: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  approved?: boolean;
}

// Augment Express' Request type so downstream code that expects req.user
// doesn't conflict with Express' built-in Request type in route signatures.
declare global {
  namespace Express {
    interface Request {
      // optional here keeps it compatible with vanilla RequestHandler types
      user?: AuthUser;
    }
  }
}

// Export a convenience AuthRequest type for handlers that want the stronger type
export interface AuthRequest extends Request {
  user?: AuthUser;
}
