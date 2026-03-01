import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== "admin") {
        res.status(403).json({ error: "Forbidden - Admin access required" });
        return;
    }
    next();
};
