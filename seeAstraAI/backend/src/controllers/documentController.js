import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import Document from "../models/Document.js";
import axios from "axios";
import mongoose from "mongoose";
import { writeAuditLog } from "../utils/writeAuditLog.js";

export async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a PDF document",
    });
  }

  try {
    const fileBuffer = await fs.readFile(req.file.path);

    const fileHash = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");

    const duplicate = await Document.findOne({
    owner: req.user._id,
    fileHash,
    });

    if (duplicate) {
    await fs.unlink(req.file.path).catch(() => {});

    return res.status(409).json({
        success: false,
        message: "This exact PDF has already been uploaded.",
        existingDocumentId: duplicate._id,
    });
    }

    const document = await Document.create({
      owner: req.user._id,
      originalName: path.basename(req.file.originalname),
      storedName: req.file.filename,
      mimeType: "application/pdf",
      size: req.file.size,
      fileHash,
      status: "uploaded",
      
    });

    await writeAuditLog({
  actor: req.user._id,
  action: "DOCUMENT_UPLOADED",
  documentIds: [document._id],
  outcome: "success",
  details: {
    fileSize: document.size,
    mimeType: document.mimeType,
  },
});

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: document._id,
        originalName: document.originalName,
        size: document.size,
        status: document.status,
        uploadedAt: document.createdAt,
      },
    });
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => {});

    console.error("Document upload failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save document details",
    });
  }
}


export async function analyzeDocument(req, res) {
  let document;

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (!process.env.AI_SERVICE_URL) {
      console.error("AI_SERVICE_URL is missing");

      return res.status(500).json({
        success: false,
        message: "AI service configuration is missing",
      });
    }

    const uploadsDirectory = path.resolve(process.cwd(), "uploads");
    const filePath = path.resolve(
      uploadsDirectory,
      document.storedName
    );

    // Ensure the resolved file is directly inside uploads.
    if (path.dirname(filePath) !== uploadsDirectory) {
      return res.status(400).json({
        success: false,
        message: "Invalid document storage path",
      });
    }

    document.status = "processing";
    await document.save();

    let response;

    try {
      response = await axios.post(
        `${process.env.AI_SERVICE_URL}/extract-text`,
        { file_path: filePath },
        { timeout: 120000 }
      );
    } catch (error) {
      document.status = "failed";
      await document.save();

      console.error(
        "AI service request failed:",
        error.response?.status || error.code || error.message
      );

      return res.status(502).json({
        success: false,
        message: "Document analysis service is unavailable",
      });
    }

    if (!response.data?.success) {
      document.status = "failed";
      await document.save();

      return res.status(502).json({
        success: false,
        message: "AI service returned an invalid response",
      });
    }

    document.analysisResult = response.data;
    document.status = "processed";
    document.analyzedAt = new Date();
    await document.save();

    await writeAuditLog({
      actor: req.user._id,
      action: "DOCUMENT_ANALYZED",
      documentIds: [document._id],
      outcome: response.data.analysis?.requires_human_review
        ? "warning"
        : "success",
      details: {
        findingCount:
          response.data.analysis?.finding_count ?? null,
        requiresHumanReview:
          response.data.analysis?.requires_human_review ?? null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Document analysis completed",
      documentId: document._id,
      analysis: response.data,
    });
  } catch (error) {
    console.error("Document analysis failed:", error.message);

    return res.status(500).json({
      success: false,
      message:
        error.message === "Unable to record audit event"
          ? "Analysis completed, but audit logging failed"
          : "Unable to analyze document",
    });
  }
}

export async function getMyDocuments(req, res) {
  try {
    const documents = await Document.find({
      owner: req.user._id,
    })
      .select("originalName size status createdAt analyzedAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Fetching documents failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch documents",
    });
  }
}

export async function getDocumentAnalysis(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })
      .select(
        "originalName size status analysisResult analyzedAt createdAt"
      )
      .lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error(
      "Fetching document analysis failed:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch document analysis",
    });
  }
}

export async function checkMyDocumentsConsistency(req, res) {
  try {
    const { documentIds } = req.body ?? {};

    if (
      !Array.isArray(documentIds) ||
      documentIds.length < 2 ||
      documentIds.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide between 2 and 50 document IDs",
      });
    }

    if (
      !documentIds.every(
        (id) =>
          typeof id === "string" &&
          mongoose.isValidObjectId(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more document IDs are invalid",
      });
    }

    const uniqueIds = [...new Set(documentIds)];

    if (uniqueIds.length !== documentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate document IDs are not allowed",
      });
    }

    const documents = await Document.find({
      _id: { $in: uniqueIds },
      owner: req.user._id,
    }).lean();

    if (documents.length !== uniqueIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more documents were not found",
      });
    }

    const notProcessed = documents.some(
      (doc) =>
        doc.status !== "processed" ||
        !doc.analysisResult?.extracted_fields
    );

    if (notProcessed) {
      return res.status(409).json({
        success: false,
        message:
          "Analyze all selected documents before comparing them",
      });
    }

    if (!process.env.AI_SERVICE_URL) {
      console.error("AI_SERVICE_URL is missing");

      return res.status(500).json({
        success: false,
        message: "AI service configuration is missing",
      });
    }

    const consistencyDocuments = documents.map((doc) => ({
      document_id: doc._id.toString(),
      fields: doc.analysisResult.extracted_fields,
    }));

    let aiResponse;

    try {
      aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/check-consistency`,
        { documents: consistencyDocuments },
        { timeout: 30000 }
      );
    } catch (error) {
      console.error(
        "Consistency AI request failed:",
        error.response?.status || error.code || error.message
      );

      return res.status(502).json({
        success: false,
        message: "Consistency analysis service is unavailable",
      });
    }

    const analysis = aiResponse.data?.analysis;

    if (!aiResponse.data?.success || !analysis) {
      return res.status(502).json({
        success: false,
        message: "AI service returned an invalid response",
      });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: "CONSISTENCY_CHECKED",
      documentIds: documents.map((doc) => doc._id),
      outcome: analysis.requires_human_review
        ? "warning"
        : "success",
      details: {
        documentsCompared: documents.length,
        findingCount: analysis.finding_count ?? null,
      },
    });

    return res.status(200).json({
      success: true,
      documentsCompared: documents.length,
      analysis,
    });
  } catch (error) {
    console.error(
      "Cross-document check failed:",
      error.code || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message === "Unable to record audit event"
          ? "Unable to record the audit event"
          : "Unable to check document consistency",
    });
  }
}
