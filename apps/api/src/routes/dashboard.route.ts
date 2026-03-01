import { Router } from "express";
import {
    getDashboardStats,
    getCategoryBreakdown,
    getMonthlyTrends,
} from "../controller/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

// All dashboard routes are accessible to all authenticated users (including read-only)
router.get("/stats", authenticate, getDashboardStats);
router.get("/categories", authenticate, getCategoryBreakdown);
router.get("/trends", authenticate, getMonthlyTrends);

export default router;
