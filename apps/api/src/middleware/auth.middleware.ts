import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: "admin" | "user" | "read-only";
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies.token;

    if (!token) {
        res.status(401).json({ error: "Unauthorized - No token provided" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Unauthorized - Invalid token" });
        return;
    }
};
