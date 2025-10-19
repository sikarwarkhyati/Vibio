import { Request } from "express";
import { IUser } from "../models/users.js"; // ✅ Add .js extension for ESM
import { Types } from "mongoose";

export interface AuthRequest extends Request {
  user?: IUser; // Will store authenticated user info after JWT validation
}
