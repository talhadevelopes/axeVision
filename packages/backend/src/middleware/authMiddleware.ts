import type { Request, Response, NextFunction } from "express";
import { MemberType } from "../models";
import { verifyToken } from "../utils/jwt";
import { sendError } from "../types/response";

interface JwtPayload {
  userId: string;
  memberId?: string;
  memberType?: MemberType;
}

export interface AuthRequest extends Request {
  website?: {
    _id: string;
    url: string;
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  };
  userId?: string;
  memberId?: string;
  memberType?: MemberType;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return sendError(res, 401, "Unauthorized", "NO_TOKEN");
  }

  try {
    const decoded = verifyToken<JwtPayload>(token);
    req.userId = decoded.userId;
    req.memberId = decoded.memberId;
    req.memberType = decoded.memberType;
    console.log("Authenticated userId:", req.userId);
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return sendError(res, 401, "Unauthorized", "INVALID_TOKEN");
  }
};

export const requireMember = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.memberId && !req.params.memberId) {
    return res.status(400).json({
      error: "Member context required. Please select a member profile.",
    });
  }
  next();
};

export const authorizeRoles =
  (...allowedTypes: MemberType[]) =>
    (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.memberType || !allowedTypes.includes(req.memberType)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }
      next();
    };
