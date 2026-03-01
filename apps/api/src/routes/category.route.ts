import { Router } from "express";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    seedCategories,
} from "../controller/category.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireWriteAccess } from "../middleware/write-access.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all categories
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, getCategories);
/**
 * @swagger
 * /api/categories/seed:
 *   post:
 *     summary: Seed default categories (Admin only)
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Seeded default categories successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 *       500:
 *         description: Server error
 */
router.post("/seed", authenticate, requireAdmin, seedCategories);
/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a newly category (Write access required)
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input or category already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Read-only user)
 *       500:
 *         description: Server error
 */
router.post("/", authenticate, requireWriteAccess, createCategory);
/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update an existing category (Write access required)
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input or duplicate category name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Read-only user)
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticate, requireWriteAccess, updateCategory);
/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category (Write access required)
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Read-only user)
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticate, requireWriteAccess, deleteCategory);

export default router;
