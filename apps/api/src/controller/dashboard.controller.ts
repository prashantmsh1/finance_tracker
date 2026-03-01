import { Response } from "express";
import { db, eq, sql, and, gte, lte } from "@expense-tracker/db";
import { transactions, categories } from "@expense-tracker/db/schema";
import { AuthRequest } from "../middleware/auth.middleware.js";

// GET /api/dashboard/stats — summary statistics
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let targetUserId = req.user!.id;
        if (req.user!.role === "admin" && req.query.userId) {
            targetUserId = req.query.userId as string;
        }

        const month = req.query.month ? parseInt(req.query.month as string) : undefined;
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;

        // Build conditions
        const conditions = [eq(transactions.userId, targetUserId)];

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            conditions.push(gte(transactions.date, startDate));
            conditions.push(lte(transactions.date, endDate));
        } else if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            conditions.push(gte(transactions.date, startDate));
            conditions.push(lte(transactions.date, endDate));
        }

        const whereClause = and(...conditions);

        const result = await db
            .select({
                totalTransactions: sql<number>`count(*)::int`,
                totalIncome: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
                totalExpense: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
            })
            .from(transactions)
            .where(whereClause);

        const stats = result[0];
        const balance = parseFloat(stats.totalIncome) - parseFloat(stats.totalExpense);

        res.status(200).json({
            stats: {
                totalTransactions: stats.totalTransactions,
                totalIncome: stats.totalIncome,
                totalExpense: stats.totalExpense,
                balance: balance.toFixed(2),
            },
        });
    } catch (error) {
        console.error("Get Dashboard Stats Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/dashboard/categories — category-wise expense breakdown
export const getCategoryBreakdown = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let targetUserId = req.user!.id;
        if (req.user!.role === "admin" && req.query.userId) {
            targetUserId = req.query.userId as string;
        }

        const month = req.query.month ? parseInt(req.query.month as string) : undefined;
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;

        const conditions = [
            eq(transactions.userId, targetUserId),
            eq(transactions.type, "expense"),
        ];

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            conditions.push(gte(transactions.date, startDate));
            conditions.push(lte(transactions.date, endDate));
        } else if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            conditions.push(gte(transactions.date, startDate));
            conditions.push(lte(transactions.date, endDate));
        }

        const whereClause = and(...conditions);

        const result = await db
            .select({
                categoryId: transactions.categoryId,
                categoryName: sql<string>`coalesce(${categories.name}, 'Uncategorized')`,
                total: sql<string>`sum(${transactions.amount})`,
                count: sql<number>`count(*)::int`,
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(whereClause)
            .groupBy(transactions.categoryId, categories.name);

        res.status(200).json({ breakdown: result });
    } catch (error) {
        console.error("Get Category Breakdown Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/dashboard/trends — monthly income/expense trends for the last 12 months
export const getMonthlyTrends = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let targetUserId = req.user!.id;
        if (req.user!.role === "admin" && req.query.userId) {
            targetUserId = req.query.userId as string;
        }

        // Last 12 months from now
        const now = new Date();
        const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);

        const result = await db
            .select({
                month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
                monthLabel: sql<string>`to_char(${transactions.date}, 'Mon YYYY')`,
                income: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
                expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
            })
            .from(transactions)
            .where(and(eq(transactions.userId, targetUserId), gte(transactions.date, startDate)))
            .groupBy(
                sql`to_char(${transactions.date}, 'YYYY-MM')`,
                sql`to_char(${transactions.date}, 'Mon YYYY')`,
            )
            .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`);

        res.status(200).json({ trends: result });
    } catch (error) {
        console.error("Get Monthly Trends Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
