import express from "express";
import { bookTickets } from "../controllers/ticketBookingController.js";
import { validateTicket } from "../controllers/ticketController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/book", authenticate, bookTickets);
router.post("/validate", authenticate, validateTicket);
export default router;