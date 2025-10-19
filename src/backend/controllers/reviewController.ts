// src/backend/controllers/reviewController.ts
import { Response } from "express";
import Review, { IReview } from "../models/review.js";
import Event from "../models/event.js";
import mongoose, { Types } from "mongoose";
import { AuthRequest } from "../types/indexexpress.js";

// ------------------- CREATE REVIEW -------------------
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { eventId, rating, comment } = req.body as {
      eventId: string;
      rating: number;
      comment?: string;
    };

    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    // Check if user already reviewed this event
    const existing = await Review.findOne({ eventId, userId: req.user._id });
    if (existing) return res.status(400).json({ message: "You have already reviewed this event" });

    const review = new Review({
      eventId,
      userId: req.user._id,
      rating,
      comment,
    });

    await review.save();
    res.status(201).json({ message: "Review created", review });
  } catch (err) {
    console.error("Create Review Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- GET REVIEWS FOR EVENT -------------------
export const getEventReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    const reviews = await Review.find({ eventId }).populate("userId", "name email").sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Get Reviews Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- UPDATE REVIEW -------------------
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { reviewId } = req.params;
    const { rating, comment } = req.body as { rating?: number; comment?: string };

    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ message: "Invalid review ID" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Only creator or admin can update
    if (!review.userId.equals(req.user._id as Types.ObjectId) && req.user.role !== "admin") 
      return res.status(403).json({ message: "Not authorized" });

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    res.status(200).json({ message: "Review updated", review });
  } catch (err) {
    console.error("Update Review Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- DELETE REVIEW -------------------
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ message: "Invalid review ID" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Only creator or admin can delete
    if (!review.userId.equals(req.user._id as Types.ObjectId) && req.user.role !== "admin") 
      return res.status(403).json({ message: "Not authorized" });

    await review.deleteOne();
    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    console.error("Delete Review Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
