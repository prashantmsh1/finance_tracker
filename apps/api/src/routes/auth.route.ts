import { Router } from "express";
import { register, login, logout, getMe } from "../controller/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
