
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyWorkflow } from "../controllers/workflowController.js";

const router = express.Router();

router.get("/me", protect, getMyWorkflow);

export default router;
