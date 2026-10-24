
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    storedName: {
      type: String,
      required: true,
      unique: true,
    },

    fileHash: {
      type: String,
      required: true,
      index: true,
    },

    mimeType: {
      type: String,
      required: true,
      default: "application/pdf",
    },

    size: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      default: "uploaded",
      index: true,
    },

    analysisResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    analyzedAt: {
      type: Date,
      default: null,
    },

    // Final decision recorded by the reviewer
    finalDecision: {
      status: {
        type: String,
        enum: [
          "not_decided",
          "approved",
          "correction_requested",
          "rejected",
        ],
        default: "not_decided",
      },

      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      notes: {
        type: String,
        default: "",
        maxlength: 2000,
      },

      decidedAt: {
        type: Date,
        default: null,
      },
    },

    // Links this submission to the previous version
    previousSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
      index: true,
    },

    // Version 1 = original submission; 2+ = resubmissions
    submissionVersion: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Stable ID shared by all versions of one application
    applicationGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
