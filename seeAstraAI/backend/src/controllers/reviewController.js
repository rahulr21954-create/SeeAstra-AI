
import mongoose from "mongoose";
import Document from "../models/Document.js";
import ReviewRecord from "../models/ReviewRecord.js";
import { writeAuditLog } from "../utils/writeAuditLog.js";

export async function getReviewQueue(req, res) {
  try {
    const documents = await Document.find({
      status: "processed",
      "analysisResult.analysis.findings.0": {
        $exists: true,
      },
    })
      .select(
        "originalName size owner analysisResult.analysis createdAt analyzedAt"
      )
      .sort({ analyzedAt: -1 })
      .limit(50)
      .lean();

    const documentIds = documents.map((doc) => doc._id);

    const reviews = await ReviewRecord.find({
      document: { $in: documentIds },
    }).lean();

    const reviewMap = new Map(
      reviews.map((review) => [
        `${review.document.toString()}:${review.findingIndex}`,
        review,
      ])
    );

    const queue = documents.map((doc) => {
      const findings = doc.analysisResult?.analysis?.findings ?? [];

      return {
        documentId: doc._id,
        originalName: doc.originalName,
        analyzedAt: doc.analyzedAt,
        findings: findings.map((finding, index) => ({
          findingIndex: index,
          finding,
          review:
            reviewMap.get(`${doc._id.toString()}:${index}`) ??
            null,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      count: queue.length,
      documents: queue,
    });
  } catch (error) {
    console.error("Review queue failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch review queue",
    });
  }
}

export async function reviewFinding(req, res) {
  try {
    const { documentId } = req.params;
const findingIndex = Number(req.params.findingIndex);
const { decision, reviewerNotes = "" } = req.body ?? {};

    if (!mongoose.isValidObjectId(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    if (
      !Number.isInteger(findingIndex) ||
      findingIndex < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid finding index is required",
      });
    }

    if (
      !["pending", "confirmed", "dismissed"].includes(decision)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be pending, confirmed, or dismissed",
      });
    }

    if (
      typeof reviewerNotes !== "string" ||
      reviewerNotes.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Reviewer notes must be 2000 characters or fewer",
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      status: "processed",
    }).lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Processed document not found",
      });
    }

    const findings =
      document.analysisResult?.analysis?.findings;

    if (
      !Array.isArray(findings) ||
      findingIndex >= findings.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Finding does not exist in this document",
      });
    }

    const review = await ReviewRecord.findOneAndUpdate(
      {
        document: document._id,
        findingIndex,
      },
      {
        $set: {
          findingSnapshot: findings[findingIndex],
          reviewer: req.user._id,
          decision,
          reviewerNotes: reviewerNotes.trim(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await writeAuditLog({
      actor: req.user._id,
      action: "FINDING_REVIEWED",
      documentIds: [document._id],
      outcome:
        decision === "pending" ? "warning" : "success",
      details: {
        findingIndex,
        decision,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Finding review saved",
      review,
    });
  } catch (error) {
    console.error("Finding review failed:", error.message);

    return res.status(500).json({
      success: false,
      message:
        error.message === "Unable to record audit event"
          ? "Review saved, but audit logging failed"
          : "Unable to save finding review",
    });
  }
}
