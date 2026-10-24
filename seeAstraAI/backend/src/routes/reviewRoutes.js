
import express from "express";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import {
  getReviewQueue,
  reviewFinding,
} from "../controllers/reviewController.js";

const router = express.Router();

router.use(protect, authorizeRoles("reviewer", "admin"));

router.get("/queue", getReviewQueue);

router.patch(
  "/:documentId/findings/:findingIndex",
  reviewFinding
);

export default router;
