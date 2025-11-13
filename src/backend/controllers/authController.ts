// src/backend/controllers/authController.ts
import { Request, Response } from "express";
import User, { RoleType, IUser } from "../models/users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import { sendEmail } from "../utils/sendEmail";
// add to authController.ts
import { AuthRequest } from "../types/indexexpress";
import ApprovalRequest from "../models/approvalRequest";
import Organization, { IOrganization } from "../models/organization";

// Signup request interface
interface SignupRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
    role?: RoleType;
    organizationId?: string;
    orgName?: string;
    organizationName?: string;
    payload?: { organizationName?: string };
  };
}

// ------------------- SIGNUP -------------------
export const signup = async (req: SignupRequest, res: Response) => {
  try {
    const { name, email, password, role, organizationId, orgName, organizationName, payload } =
      req.body;

    const normalizedRole: RoleType =
      role && ["user", "organizer", "admin", "superadmin"].includes(role)
        ? role
        : "user";

    // 1️⃣ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 4️⃣ Create user in DB
    // Note: We use Partial<IUser> here and will safely cast ObjectId values where TS complains.
    const userPayload: Partial<IUser> & {
      name: string;
      email: string;
      password: string;
      role: RoleType;
      verified: boolean;
      verificationToken: string;
      verificationTokenExpiry: Date;
      organizationId?: mongoose.Types.ObjectId | null;
      approved?: boolean;
      approvalStatus?: "pending" | "approved" | "rejected";
    } = {
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      verified: false,
      verificationToken,
      verificationTokenExpiry,
    };

    if (
      organizationId &&
      mongoose.Types.ObjectId.isValid(organizationId) &&
      normalizedRole === "user"
    ) {
      userPayload.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    const requiresApproval = normalizedRole === "organizer" || normalizedRole === "admin";

    let resolvedOrgName =
      typeof organizationName === "string" && organizationName.trim().length
        ? organizationName.trim()
        : typeof orgName === "string" && orgName.trim().length
        ? orgName.trim()
        : typeof payload?.organizationName === "string" && payload.organizationName.trim().length
        ? payload.organizationName.trim()
        : "";

    let linkedOrganization: IOrganization | null = null;

    if (normalizedRole === "organizer") {
      if (!resolvedOrgName) {
        return res.status(400).json({ message: "Organization name is required for organizer signup" });
      }

      const slugCandidate = resolvedOrgName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      linkedOrganization = await Organization.findOne({
        $or: [
          { slug: slugCandidate },
          { name: { $regex: new RegExp(`^${resolvedOrgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        ],
      });
    }

    if (requiresApproval) {
      userPayload.approved = false;
      userPayload.approvalStatus = "pending";

      if (normalizedRole === "organizer" && linkedOrganization) {
        // linkedOrganization._id might have an ambiguous type for TS; cast safely
        userPayload.organizationId = (linkedOrganization._id as unknown) as mongoose.Types.ObjectId;
      } else if (
        normalizedRole === "admin" &&
        organizationId &&
        mongoose.Types.ObjectId.isValid(organizationId)
      ) {
        userPayload.organizationId = new mongoose.Types.ObjectId(organizationId);
      }
    }

    const newUser = new User(userPayload);

    await newUser.save();

    if (requiresApproval) {
      const approvalPayload: Record<string, unknown> = {};
      if (resolvedOrgName) {
        approvalPayload.organizationName = resolvedOrgName;
      }
      if (linkedOrganization) {
        // again cast id value for storage into payload if needed
        approvalPayload.organizationId = (linkedOrganization._id as unknown) as mongoose.Types.ObjectId;
      } else if (
        normalizedRole === "admin" &&
        organizationId &&
        mongoose.Types.ObjectId.isValid(organizationId)
      ) {
        approvalPayload.organizationId = new mongoose.Types.ObjectId(organizationId);
      }

      await ApprovalRequest.create({
        requesterId: newUser._id,
        requesterRole: normalizedRole === "organizer" ? "organizer" : "admin",
        status: "pending",
        payload: approvalPayload,
      });
    }

    // 5️⃣ Send verification email
    const baseUrl =
      (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) ||
      (process.env.APP_BASE_URL && process.env.APP_BASE_URL.trim()) ||
      "http://localhost:5173";
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const verificationLink = `${normalizedBase}/verify-email?token=${verificationToken}&email=${email}`;
    await sendEmail(
      email,
      "Verify your Vibio account",
      `<p>Hi ${name},</p>
       <p>Thank you for signing up! Please verify your email by clicking the link below:</p>
       <a href="${verificationLink}">Verify Email</a>
       <p>This link expires in 24 hours.</p>`
    );

    // 6️⃣ Respond success
    res.status(201).json({
      message: requiresApproval
        ? "Account created — pending approval by superadmin. Check your email to verify your account."
        : "User created successfully. Check your email to verify your account.",
      approvalPending: requiresApproval,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- EMAIL VERIFICATION -------------------
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, token } = req.query;

    if (!email || !token)
      return res.status(400).json({ message: "Invalid verification link" });

    const user = await User.findOne({ email, verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid verification link" });

    // Check if token is expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return res.status(400).json({ message: "Verification link has expired" });
    }

    if (user.verified)
      return res.status(400).json({ message: "Email already verified" });

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify Email Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- LOGIN -------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (
      (user.role === "organizer" || user.role === "admin") &&
      user.approvalStatus !== "approved"
    ) {
      return res
        .status(403)
        .json({ message: "Account pending approval" });
    }

    if (user.approvalStatus === "rejected") {
      return res.status(403).json({ message: "Account approval was rejected" });
    }

    if (!user.verified)
      return res.status(403).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        approvalStatus: user.approvalStatus,
        approved: user.approved,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
// ------------------- GET CURRENT USER (/api/auth/me) -------------------
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Minimal safe shape for frontend
    const safeUser = {
      _id: req.user._id,
      id: req.user._id, // convenience for frontend
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      verified: req.user.verified,
      organizationId: req.user.organizationId || null,
      approvalStatus: req.user.approvalStatus,
      approved: req.user.approved,
    };

    return res.status(200).json({ user: safeUser });
  } catch (err) {
    console.error("getMe Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
