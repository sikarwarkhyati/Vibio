import express from "express";
import {
  getOrganizerContactInfo,
  getOrganizerStats,
} from "../controllers/organiserController";

const router = express.Router();

// Publicly accessible routes
// @ts-ignore
router.get("/:id/contact-info", getOrganizerContactInfo);
// @ts-ignore
router.get("/:id/stats", getOrganizerStats);

export default router;
