import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";

/**
 * Middleware that blocks read-only users from write operations (POST, PUT, DELETE).
 * Must be used AFTER authenticate middleware.
 * Allows admin and user roles through.
 */
export const requireWriteAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role === "read-only") {
        res.status(403).json({
            error: "Forbidden - Read-only users cannot perform write operations",
        });
        return;
    }
    next();
};
