import express from "express";
import {
  createReview,
  getEventReviews,
  updateReview,
  deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

// Create a review
router.post("/", createReview);

// Get all reviews for an event
router.get("/event/:eventId", getEventReviews);

// Update a review
router.patch("/:reviewId", updateReview);

// Delete a review
router.delete("/:reviewId", deleteReview);

export default router;
