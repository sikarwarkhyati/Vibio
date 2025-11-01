import express from "express";
import {
  createReview,
  getEventReviews,
  updateReview,
  deleteReview
} from "../controllers/reviewController";

const router = express.Router();

// Create a review
// @ts-ignore
router.post("/", createReview);

// Get all reviews for an event
// @ts-ignore
router.get("/event/:eventId", getEventReviews);

// Update a review
// @ts-ignore
router.patch("/:reviewId", updateReview);

// Delete a review
// @ts-ignore
router.delete("/:reviewId", deleteReview);

export default router;
