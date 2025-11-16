// src/backend/routes/contactRoutes.ts
import express from "express";
import { contactOrganizer } from "../controllers/contactController";

const router = express.Router();

// Public endpoint for contacting an organizer
// @ts-ignore
router.post("/organizer", contactOrganizer);

export default router;
