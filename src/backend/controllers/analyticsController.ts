// src/backend/controllers/analyticsController.ts
import { Request, Response } from "express";

/**
 * Simple analytics endpoint.
 * Stores to DB later — for now we accept and return 200.
 */
export const trackAnalytics = async (req: Request, res: Response) => {
  try {
    const payload = req.body ?? {};
    // TODO: persist payload to DB (analytics collection) if desired.
    console.info("Analytics event:", payload);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Analytics error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
