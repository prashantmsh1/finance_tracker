import { Request, Response } from "express";
import { db, eq, sql } from "@expense-tracker/db";
import { users, transactions } from "@expense-tracker/db/schema";

// GET /api/users — admin-only, returns all users
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const allUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .orderBy(users.createdAt);

        res.status(200).json({ users: allUsers });
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/users/:id — admin-only, returns single user + transaction summary
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const userResult = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, id));

        if (userResult.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // Get transaction summary for this user
        const summary = await db
            .select({
                totalTransactions: sql<number>`count(*)::int`,
                totalIncome: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
                totalExpense: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
            })
            .from(transactions)
            .where(eq(transactions.userId, id));

        res.status(200).json({
            user: userResult[0],
            summary: summary[0],
        });
    } catch (error) {
        console.error("Get User By ID Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
