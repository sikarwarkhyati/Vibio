import { Request, Response } from "express";
import User from "../models/users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import { sendEmail } from "../utils/sendEmail.js";

// Signup request interface
interface SignupRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
    role?: "user" | "organizer" | "admin";
    organizationId?: string;
  };
}

// ------------------- SIGNUP -------------------
export const signup = async (req: SignupRequest, res: Response) => {
  try {
    const { name, email, password, role, organizationId } = req.body;

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
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      organizationId:
        role === "organizer" && organizationId
          ? new mongoose.Types.ObjectId(organizationId)
          : undefined,
      verified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    await newUser.save();

    // 5️⃣ Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${email}`;
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
      message: "User created successfully. Check your email to verify your account.",
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
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
