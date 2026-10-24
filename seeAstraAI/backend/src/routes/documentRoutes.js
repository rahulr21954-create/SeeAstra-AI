
import { Router } from "express";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  uploadDocument,
  analyzeDocument,
  getMyDocuments,
  getDocumentAnalysis,
  checkMyDocumentsConsistency,
} from "../controllers/documentController.js";

import {
  getApplicationDecision,
  saveApplicationDecision,
} from "../controllers/applicationDecisionController.js";

import {
  getApplicationStatus,
} from "../controllers/applicationStatusController.js";

const router = Router();

router.post(
  "/upload",
  protect,
  upload.single("document"),
  uploadDocument
);

router.post(
  "/check-consistency",
  protect,
  checkMyDocumentsConsistency
);

router.post("/:id/analyze", protect, analyzeDocument);

router.get("/", protect, getMyDocuments);

router.get("/:id/analysis", protect, getDocumentAnalysis);

// Application-level final decision
router.get(
  "/:id/decision",
  protect,
  getApplicationDecision
);

router.patch(
  "/:id/decision",
  protect,
  authorizeRoles("reviewer", "admin"),
  saveApplicationDecision
);

router.get("/:id/status", protect, getApplicationStatus);

export default router;
