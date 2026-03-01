import { Router } from "express";
import {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from "../controller/transaction.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireWriteAccess } from "../middleware/write-access.middleware.js";

const router: Router = Router();

router.get("/", authenticate, getTransactions);
router.get("/:id", authenticate, getTransactionById);
router.post("/", authenticate, requireWriteAccess, createTransaction);
router.put("/:id", authenticate, requireWriteAccess, updateTransaction);
router.delete("/:id", authenticate, requireWriteAccess, deleteTransaction);

export default router;
