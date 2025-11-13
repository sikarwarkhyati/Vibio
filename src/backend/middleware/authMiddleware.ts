// src/backend/middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import { AuthRequest, AuthUser } from "../types/indexexpress.js";

// Authenticate: ensure token is valid and attach typed user to req
export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const userDoc = await User.findById(decoded.id);
    if (!userDoc) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Build the clean AuthUser object
    const safeUser: AuthUser = {
      _id: userDoc._id,
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      organizationId: userDoc.organizationId,
      verified: userDoc.verified,
      approvalStatus: userDoc.approvalStatus,
      approved: userDoc.approved,
    };

    // assign to req.user for downstream handlers (AuthRequest)
    // @ts-expect-error runtime augmentation
    req.user = safeUser;

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Authorize based on roles: returns an Express RequestHandler (compatible with router)
export const authorizeRoles =
  (...roles: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    // Cast to AuthRequest to read user safely
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(authReq.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    next();
  };
