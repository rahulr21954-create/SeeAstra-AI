import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyAuditHistory } from "../controllers/auditController.js";

const router = Router();

router.get("/me", protect, getMyAuditHistory);

export default router;