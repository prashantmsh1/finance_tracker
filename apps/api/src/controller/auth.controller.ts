import { Request, Response } from "express";
import { db, eq } from "@expense-tracker/db";
import { users } from "@expense-tracker/db/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        // Check if user exists
        const existingUsers = await db.select().from(users).where(eq(users.email, email));
        if (existingUsers.length > 0) {
            res.status(400).json({ error: "User already exists" });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const newUsers = await db
            .insert(users)
            .values({
                name,
                email,
                passwordHash,
            })
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
            });

        const user = newUsers[0];

        // Generate JWT
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });

        // Set Cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Missing email or password" });
            return;
        }

        // Find user
        const existingUsers = await db.select().from(users).where(eq(users.email, email));
        if (existingUsers.length === 0) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        const user = existingUsers[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });

        // Set Cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            message: "Login successful",
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0), // expire immediately
    });
    res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    res.status(200).json({ user: req.user });
};
