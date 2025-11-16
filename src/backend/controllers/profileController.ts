// src/backend/controllers/profileController.ts
import { Request, Response } from "express";
import User from "../models/users";
import mongoose from "mongoose";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const user = await User.findById(userId).select("name email role organizationId profilePicture").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
