// src/backend/controllers/contactController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/users";
import { sendEmail } from "../utils/sendEmail";

export const contactOrganizer = async (req: Request, res: Response) => {
  try {
    const {
      organizerId,
      organizerEmail,
      organizerName,
      eventTitle,
      senderName,
      senderEmail,
      subject,
      message,
    } = req.body ?? {};

    if (
      typeof senderName !== "string" ||
      typeof senderEmail !== "string" ||
      typeof message !== "string" ||
      senderName.trim().length === 0 ||
      senderEmail.trim().length === 0 ||
      message.trim().length === 0
    ) {
      return res.status(400).json({ message: "Missing required contact fields" });
    }

    let targetEmail = typeof organizerEmail === "string" ? organizerEmail.trim() : "";
    let targetName = typeof organizerName === "string" ? organizerName.trim() : "";

    if ((!targetEmail || !targetName) && typeof organizerId === "string") {
      if (mongoose.Types.ObjectId.isValid(organizerId)) {
        // <-- minimal, safe cast so TS knows organizer has name/email properties
        const organizer = (await User.findById(organizerId)
          .select("name email")
          .lean()) as { name?: string; email?: string } | null;

        if (organizer) {
          if (!targetEmail) targetEmail = organizer.email || targetEmail;
          if (!targetName) targetName = organizer.name || targetName;
        }
      }
    }

    if (!targetEmail) {
      targetEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || "";
    }

    if (!targetEmail) {
      return res.status(400).json({ message: "Organizer email unavailable" });
    }

    const safeSubject =
      typeof subject === "string" && subject.trim().length > 0
        ? subject.trim()
        : `New message about ${eventTitle || "your event"}`;

    const safeMessage = message.replace(/\n/g, "<br />");
    const html = `
      <p>Hi ${targetName || "there"},</p>
      <p>You received a new message from the Vibio platform regarding <strong>${
        eventTitle || "one of your events"
      }</strong>.</p>
      <p><strong>From:</strong> ${senderName.trim()} (${senderEmail.trim()})</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
      <hr />
      <p>You can reply directly to this email to contact ${senderName.trim().split(" ")[0]}.</p>
    `;

    await sendEmail(targetEmail, safeSubject, html);

    return res.status(200).json({ message: "Message sent" });
  } catch (err) {
    console.error("contactOrganizer Error:", err);
    return res.status(500).json({ message: "Failed to send message" });
  }
};
