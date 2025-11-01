// src/backend/routes/ticketRoutes.ts
import express from "express";
import { bookTickets } from "../controllers/ticketBookingController";
import { validateTicket } from "../controllers/ticketController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();
// @ts-ignore
router.post("/book", authenticate, bookTickets);
// @ts-ignore
router.post("/validate", authenticate, validateTicket);
export default router;