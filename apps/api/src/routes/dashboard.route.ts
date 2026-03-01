import { Router } from "express";
import {
    getDashboardStats,
    getCategoryBreakdown,
    getMonthlyTrends,
} from "../controller/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and dashboard statistics
 */

// All dashboard routes are accessible to all authenticated users (including read-only)
/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get overall dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year (e.g., 2026)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Admin only - get stats for specific user
 *     responses:
 *       200:
 *         description: Dashboard statistics (balance, income, expenses, count)
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", authenticate, getDashboardStats);
/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Get category-wise expense breakdown
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year (e.g., 2026)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Admin only - get stats for specific user
 *     responses:
 *       200:
 *         description: Expense breakdown by category
 *       401:
 *         description: Unauthorized
 */
router.get("/categories", authenticate, getCategoryBreakdown);
/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly income and expense trends for the last 12 months
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Admin only - get stats for specific user
 *     responses:
 *       200:
 *         description: Monthly trends data
 *       401:
 *         description: Unauthorized
 */
router.get("/trends", authenticate, getMonthlyTrends);

export default router;
