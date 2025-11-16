// src/backend/controllers/superadminController.ts
import { Request, Response } from "express";
import ApprovalRequest from "../models/approvalRequest";
import User from "../models/users";
import Organization from "../models/organization";
import mongoose from "mongoose";

/**
 * GET /api/superadmin/requests
 * Return all pending approval requests
 */
export const listApprovalRequests = async (_req: Request, res: Response) => {
  try {
    const reqs = await ApprovalRequest.find({ status: "pending" }).populate(
      "requesterId",
      "name email role"
    );
    return res.status(200).json({ requests: reqs });
  } catch (err) {
    console.error("listApprovalRequests Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/superadmin/requests/:id/approve
 * Approve request (admin or organizer)
 */
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const approval = await ApprovalRequest.findById(id);
    if (!approval) return res.status(404).json({ message: "Request not found" });

    if (approval.status !== "pending")
      return res.status(400).json({ message: "Request already processed" });

    const requesterRole =
      (approval as any).requesterRole || (approval as any).type || "organizer";

    let updatedUser = null;

    if (requesterRole === "organizer") {
      const orgNameRaw =
        approval.payload?.orgName || approval.payload?.organizationName || "";
      const fallbackName =
        orgNameRaw && typeof orgNameRaw === "string" ? orgNameRaw : `Org-${Date.now()}`;
      const normalizedName = (fallbackName || `Org-${Date.now()}`).trim();

      const slugBase = normalizedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);

      const rawOrgId = approval.payload?.organizationId as unknown;
      let existingOrgId: mongoose.Types.ObjectId | undefined;
      if (typeof rawOrgId === "string" && mongoose.Types.ObjectId.isValid(rawOrgId)) {
        existingOrgId = new mongoose.Types.ObjectId(rawOrgId);
      } else if (rawOrgId instanceof mongoose.Types.ObjectId) {
        existingOrgId = rawOrgId;
      }

      let organizationDoc = existingOrgId
        ? await Organization.findById(existingOrgId)
        : await Organization.findOne({ slug: slugBase });

      // if organization doesn't exist, create it and set the requester as owner
      if (!organizationDoc) {
        const slug = `${slugBase || "org"}-${Date.now().toString().slice(-4)}`;
        organizationDoc = await Organization.create({
          name: normalizedName,
          slug,
          owners: [approval.requesterId],
          status: "active",
        });
      } else {
        // owners array may contain ObjectId or string — normalize comparators
        const requesterIdStr = approval.requesterId?.toString?.() ?? String(approval.requesterId);

        const alreadyOwner = (organizationDoc.owners || []).some((owner: unknown) => {
          // owner can be ObjectId or string
          try {
            return String(owner).toString() === requesterIdStr;
          } catch {
            return false;
          }
        });

        if (!alreadyOwner) {
          organizationDoc.owners = [...(organizationDoc.owners || []), approval.requesterId];
          await organizationDoc.save();
        }
      }

      updatedUser = await User.findByIdAndUpdate(
        approval.requesterId,
        {
          organizationId: organizationDoc?._id,
          approvalStatus: "approved",
          approved: true,
        },
        { new: true }
      ).select("-password");
    } else if (requesterRole === "admin") {
      updatedUser = await User.findByIdAndUpdate(
        approval.requesterId,
        {
          approvalStatus: "approved",
          approved: true,
          role: "admin",
        },
        { new: true }
      ).select("-password");
    }

    approval.status = "approved";
    await approval.save();

    return res.status(200).json({ message: "Approved", user: updatedUser });
  } catch (err) {
    console.error("approveRequest Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/superadmin/requests/:id/reject
 */
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const approval = await ApprovalRequest.findById(id);
    if (!approval) return res.status(404).json({ message: "Request not found" });

    approval.status = "rejected";
    await approval.save();

    // mark user as rejected
    await User.findByIdAndUpdate(approval.requesterId, {
      approvalStatus: "rejected",
      approved: false,
    });

    return res.status(200).json({ message: "Rejected" });
  } catch (err) {
    console.error("rejectRequest Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
