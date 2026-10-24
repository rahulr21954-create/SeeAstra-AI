
import mongoose from "mongoose";
import Document from "../models/Document.js";

export async function getApplicationStatus(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const document = await Document.findOne({
      _id: id,
      owner: req.user._id,
    })
      .select(
        "originalName status createdAt analyzedAt finalDecision"
      )
      .lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const finalDecision = document.finalDecision ?? {
      status: "not_decided",
      notes: "",
      decidedAt: null,
    };

    let currentStage = "submitted";
    let stageMessage = "Your application has been submitted.";

    if (document.status === "failed") {
      currentStage = "analysis_failed";
      stageMessage =
        "Document analysis failed. Please contact the support team or upload a valid document.";
    } else if (document.status === "uploaded") {
      currentStage = "analysis_pending";
      stageMessage = "Your document is waiting for analysis.";
    } else if (document.status === "processing") {
      currentStage = "analyzing";
      stageMessage = "Your document is being analyzed.";
    } else if (document.status === "processed") {
      currentStage = "under_review";
      stageMessage =
        "Analysis is complete. Your application is awaiting or undergoing reviewer assessment.";
    }

    if (finalDecision.status === "approved") {
      currentStage = "approved";
      stageMessage = "The reviewer has approved your application.";
    } else if (finalDecision.status === "correction_requested") {
      currentStage = "correction_requested";
      stageMessage =
        "The reviewer has requested corrections to your application.";
    } else if (finalDecision.status === "rejected") {
      currentStage = "rejected";
      stageMessage = "The reviewer has recorded a rejection decision.";
    }

    return res.status(200).json({
      success: true,
      application: {
        id: document._id,
        originalName: document.originalName,
        documentStatus: document.status,
        currentStage,
        stageMessage,
        submittedAt: document.createdAt,
        analyzedAt: document.analyzedAt,
        finalDecision: {
          status: finalDecision.status,
          notes: finalDecision.notes || "",
          decidedAt: finalDecision.decidedAt || null,
        },
      },
    });
  } catch (error) {
    console.error("Application status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch application status",
    });
  }
}
