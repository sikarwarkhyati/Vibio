// src/backend/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import { AuthRequest, AuthUser } from "../types/indexexpress.js";


// NOTE: we will assert req as AuthRequest after we build req.user.
// This avoids fighting with Express' base Request typing.

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    };

    // @ts-expect-error: we're augmenting req at runtime for downstream handlers
    req.user = safeUser;

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Authorize based on roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    next();
  };
};
