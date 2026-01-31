import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "./tokens.js";

export type AuthUser = { id: string; role: "ADMIN" | "STAFF"; staffId?: string | null };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.header("authorization");
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const token = auth.slice("Bearer ".length);
    const payload = await verifyAccess(token);
    req.user = { id: payload.sub, role: payload.role, staffId: payload.staffId ?? null };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: Array<"ADMIN" | "STAFF">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
