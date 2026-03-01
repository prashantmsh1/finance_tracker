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

router.get("/", authenticate, getCategories);
router.post("/seed", authenticate, requireAdmin, seedCategories);
router.post("/", authenticate, requireWriteAccess, createCategory);
router.put("/:id", authenticate, requireWriteAccess, updateCategory);
router.delete("/:id", authenticate, requireWriteAccess, deleteCategory);

export default router;
