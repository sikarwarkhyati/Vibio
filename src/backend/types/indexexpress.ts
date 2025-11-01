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
  role: "user" | "organizer" | "admin";
  organizationId?: Types.ObjectId;
  verified: boolean;
}

// Extend Express' Request so that downstream controllers
// can safely assume req.user exists and is of type AuthUser.
export interface AuthRequest extends Request {
  user: AuthUser;
}
