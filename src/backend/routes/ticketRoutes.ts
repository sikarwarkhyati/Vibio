// src/backend/routes/ticketRoutes.ts
import express from "express";
import { bookTickets } from "../controllers/ticketBookingController";
import { validateTicket } from "../controllers/ticketController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/book", authenticate, bookTickets);
router.post("/validate", authenticate, validateTicket);
export default router;