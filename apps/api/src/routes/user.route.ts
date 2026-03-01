import { Router } from "express";
import { getAllUsers, getUserById } from "../controller/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router: Router = Router();

router.get("/", authenticate, requireAdmin, getAllUsers);
router.get("/:id", authenticate, requireAdmin, getUserById);

export default router;
