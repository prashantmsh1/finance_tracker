import { Request, Response } from "express";
import { db, eq, sql } from "@expense-tracker/db";
import { categories } from "@expense-tracker/db/schema";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { z } from "zod";

const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["income", "expense"], { message: "Type must be 'income' or 'expense'" }),
});

const updateCategorySchema = z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    type: z
        .enum(["income", "expense"], { message: "Type must be 'income' or 'expense'" })
        .optional(),
});

const DEFAULT_CATEGORIES = [
    { name: "Food & Dining", type: "expense" as const },
    { name: "Transport", type: "expense" as const },
    { name: "Entertainment", type: "expense" as const },
    { name: "Healthcare", type: "expense" as const },
    { name: "Education", type: "expense" as const },
    { name: "Shopping", type: "expense" as const },
    { name: "Bills & Utilities", type: "expense" as const },
    { name: "Rent", type: "expense" as const },
    { name: "Other Expense", type: "expense" as const },
    { name: "Salary", type: "income" as const },
    { name: "Freelance", type: "income" as const },
    { name: "Investment", type: "income" as const },
    { name: "Gift", type: "income" as const },
    { name: "Other Income", type: "income" as const },
];

// GET /api/categories — list all categories
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
        const allCategories = await db.select().from(categories).orderBy(categories.name);

        res.status(200).json({ categories: allCategories });
    } catch (error) {
        console.error("Get Categories Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/categories — create
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = categorySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { name, type } = parsed.data;

        // Check for duplicate name
        const existing = await db.select().from(categories).where(eq(categories.name, name));
        if (existing.length > 0) {
            res.status(400).json({ error: "Category with this name already exists" });
            return;
        }

        const newCategory = await db.insert(categories).values({ name, type }).returning();

        res.status(201).json({ category: newCategory[0] });
    } catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PUT /api/categories/:id — update
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const parsed = updateCategorySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0].message });
            return;
        }
        const { name, type } = parsed.data;

        const existing = await db.select().from(categories).where(eq(categories.id, id));
        if (existing.length === 0) {
            res.status(404).json({ error: "Category not found" });
            return;
        }

        // Check for duplicate name if name is being changed
        if (name && name !== existing[0].name) {
            const duplicate = await db.select().from(categories).where(eq(categories.name, name));
            if (duplicate.length > 0) {
                res.status(400).json({ error: "Category with this name already exists" });
                return;
            }
        }

        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type;

        const updated = await db
            .update(categories)
            .set(updateData)
            .where(eq(categories.id, id))
            .returning();

        res.status(200).json({ category: updated[0] });
    } catch (error) {
        console.error("Update Category Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/categories/:id — delete
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await db.select().from(categories).where(eq(categories.id, id));
        if (existing.length === 0) {
            res.status(404).json({ error: "Category not found" });
            return;
        }

        await db.delete(categories).where(eq(categories.id, id));

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Delete Category Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/categories/seed — admin-only, seed default categories
export const seedCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        let seeded = 0;

        for (const cat of DEFAULT_CATEGORIES) {
            const existing = await db
                .select()
                .from(categories)
                .where(eq(categories.name, cat.name));
            if (existing.length === 0) {
                await db.insert(categories).values(cat);
                seeded++;
            }
        }

        res.status(200).json({
            message: `Seeded ${seeded} new categories (${DEFAULT_CATEGORIES.length - seeded} already existed)`,
        });
    } catch (error) {
        console.error("Seed Categories Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
