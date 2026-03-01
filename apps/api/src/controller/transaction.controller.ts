import { Response } from "express";
import { db, eq, sql, and, like, desc, asc, gte, lte } from "@expense-tracker/db";
import { transactions, categories } from "@expense-tracker/db/schema";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { z } from "zod";
import { clearCache } from "@expense-tracker/redis";

const createTransactionSchema = z.object({
    amount: z.coerce
        .number()
        .positive("Amount must be a positive number")
        .transform((val) => val.toFixed(2)),
    type: z.enum(["income", "expense"], { message: "Type must be 'income' or 'expense'" }),
    date: z.coerce.date(),
    description: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    userId: z.string().optional(),
});

const updateTransactionSchema = z.object({
    amount: z.coerce
        .number()
        .positive("Amount must be a positive number")
        .transform((val) => val.toFixed(2))
        .optional(),
    type: z
        .enum(["income", "expense"], { message: "Type must be 'income' or 'expense'" })
        .optional(),
    date: z.coerce.date().optional(),
    description: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
});

// GET /api/transactions — list with pagination, search, filters
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
        const offset = (page - 1) * limit;

        const search = (req.query.search as string) || "";
        const type = req.query.type as "income" | "expense" | undefined;
        const categoryId = req.query.categoryId as string | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const sortBy = (req.query.sortBy as string) || "date";
        const sortOrder = (req.query.sortOrder as string) || "desc";

        // Determine which user's transactions to fetch
        // Admin can pass userId to view another user's transactions
        let targetUserId = req.user!.id;
        if (req.user!.role === "admin" && req.query.userId) {
            targetUserId = req.query.userId as string;
        }

        // Build conditions array
        const conditions = [eq(transactions.userId, targetUserId)];

        if (search) {
            conditions.push(like(transactions.description, `%${search}%`));
        }
        if (type && (type === "income" || type === "expense")) {
            conditions.push(eq(transactions.type, type));
        }
        if (categoryId) {
            conditions.push(eq(transactions.categoryId, categoryId));
        }
        if (startDate) {
            conditions.push(gte(transactions.date, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(transactions.date, new Date(endDate)));
        }

        const whereClause = and(...conditions);

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(transactions)
            .where(whereClause);

        const total = countResult[0]?.count || 0;
        const totalPages = Math.ceil(total / limit);

        // Determine sort column
        const sortColumn = sortBy === "amount" ? transactions.amount : transactions.date;
        const orderFn = sortOrder === "asc" ? asc : desc;

        // Get paginated transactions with category info
        const result = await db
            .select({
                id: transactions.id,
                amount: transactions.amount,
                type: transactions.type,
                date: transactions.date,
                description: transactions.description,
                categoryId: transactions.categoryId,
                categoryName: categories.name,
                createdAt: transactions.createdAt,
                updatedAt: transactions.updatedAt,
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(whereClause)
            .orderBy(orderFn(sortColumn))
            .limit(limit)
            .offset(offset);

        res.status(200).json({
            transactions: result,
            pagination: { page, limit, total, totalPages },
        });
    } catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/transactions/:id — single transaction
export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const result = await db
            .select({
                id: transactions.id,
                userId: transactions.userId,
                amount: transactions.amount,
                type: transactions.type,
                date: transactions.date,
                description: transactions.description,
                categoryId: transactions.categoryId,
                categoryName: categories.name,
                createdAt: transactions.createdAt,
                updatedAt: transactions.updatedAt,
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(eq(transactions.id, id));

        if (result.length === 0) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        const transaction = result[0];

        // Non-admin users can only view their own transactions
        if (req.user!.role !== "admin" && transaction.userId !== req.user!.id) {
            res.status(403).json({ error: "Forbidden - Cannot access this transaction" });
            return;
        }

        res.status(200).json({ transaction });
    } catch (error) {
        console.error("Get Transaction By ID Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/transactions — create
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = createTransactionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { amount, type, date, description, categoryId } = parsed.data;

        // Admin can create transactions for other users
        let targetUserId = req.user!.id;
        if (req.user!.role === "admin" && req.body.userId) {
            targetUserId = req.body.userId;
        }

        const newTransaction = await db
            .insert(transactions)
            .values({
                userId: targetUserId,
                amount,
                type,
                date,
                description: description || null,
                categoryId: categoryId || null,
            })
            .returning();

        await clearCache(`dashboard:*:${targetUserId}:*`);

        res.status(201).json({ transaction: newTransaction[0] });
    } catch (error) {
        console.error("Create Transaction Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PUT /api/transactions/:id — update
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const parsed = updateTransactionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { amount, type, date, description, categoryId } = parsed.data;

        // Check transaction exists and belongs to user
        const existing = await db
            .select({ id: transactions.id, userId: transactions.userId })
            .from(transactions)
            .where(eq(transactions.id, id));

        if (existing.length === 0) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        if (req.user!.role !== "admin" && existing[0].userId !== req.user!.id) {
            res.status(403).json({ error: "Forbidden - Cannot modify this transaction" });
            return;
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (amount) updateData.amount = amount;
        if (type) updateData.type = type;
        if (date) updateData.date = date;
        if (description !== undefined) updateData.description = description || null;
        if (categoryId !== undefined) updateData.categoryId = categoryId || null;

        const updated = await db
            .update(transactions)
            .set(updateData)
            .where(eq(transactions.id, id))
            .returning();

        await clearCache(`dashboard:*:${existing[0].userId}:*`);

        res.status(200).json({ transaction: updated[0] });
    } catch (error) {
        console.error("Update Transaction Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/transactions/:id — delete
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        // Check transaction exists and belongs to user
        const existing = await db
            .select({ id: transactions.id, userId: transactions.userId })
            .from(transactions)
            .where(eq(transactions.id, id));

        if (existing.length === 0) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        if (req.user!.role !== "admin" && existing[0].userId !== req.user!.id) {
            res.status(403).json({ error: "Forbidden - Cannot delete this transaction" });
            return;
        }

        await db.delete(transactions).where(eq(transactions.id, id));

        await clearCache(`dashboard:*:${existing[0].userId}:*`);

        res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Delete Transaction Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
