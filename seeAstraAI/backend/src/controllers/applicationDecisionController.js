
import mongoose from "mongoose";
import Document from "../models/Document.js";
import { writeAuditLog } from "../utils/writeAuditLog.js";

const allowedDecisions = [
  "approved",
  "correction_requested",
  "rejected",
];

export async function getApplicationDecision(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(id)
      .select("owner originalName status finalDecision")
      .lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Owners can view their own decision; reviewers/admins can view it too.
    const role = req.user?.role;
    const isReviewer = ["reviewer", "admin"].includes(role);
    const isOwner =
      document.owner?.toString() === req.user?._id?.toString();

    if (!isReviewer && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this decision",
      });
    }

    return res.status(200).json({
      success: true,
      document: {
        id: document._id,
        originalName: document.originalName,
        status: document.status,
        finalDecision: document.finalDecision,
      },
    });
  } catch (error) {
    console.error("Get application decision failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch application decision",
    });
  }
}

export async function saveApplicationDecision(req, res) {
  try {
    const { id } = req.params;
    const { decision, notes = "" } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    if (!allowedDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be approved, correction_requested, or rejected",
      });
    }

    if (typeof notes !== "string" || notes.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Notes must be 2000 characters or fewer",
      });
    }

    if (
      ["correction_requested", "rejected"].includes(decision) &&
      !notes.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide notes explaining this decision",
      });
    }

    const document = await Document.findOne({
      _id: id,
      status: "processed",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Processed document not found",
      });
    }

    const previousDecision =
      document.finalDecision?.status ?? "not_decided";

    document.finalDecision = {
      status: decision,
      reviewer: req.user._id,
      notes: notes.trim(),
      decidedAt: new Date(),
    };

    await document.save();

    try {
      await writeAuditLog({
        actor: req.user._id,
        action: "APPLICATION_DECISION_RECORDED",
        documentIds: [document._id],
        outcome: "success",
        details: {
          previousDecision,
          decision,
        },
      });
    } catch (auditError) {
      // The decision is saved, but the audit event failed.
      console.error("Decision audit logging failed:", auditError.message);

      return res.status(500).json({
        success: false,
        decisionSaved: true,
        message:
          "Decision was saved, but audit logging failed. Please notify an administrator.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application decision saved successfully",
      finalDecision: document.finalDecision,
    });
  } catch (error) {
    console.error("Save application decision failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save application decision",
    });
  }
}
