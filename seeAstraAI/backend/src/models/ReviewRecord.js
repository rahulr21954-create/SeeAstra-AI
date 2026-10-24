
import mongoose from "mongoose";

const reviewRecordSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    findingIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    findingSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    decision: {
      type: String,
      enum: ["pending", "confirmed", "dismissed"],
      default: "pending",
      required: true,
    },

    reviewerNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One review record per finding in each document.
reviewRecordSchema.index(
  { document: 1, findingIndex: 1 },
  { unique: true }
);

const ReviewRecord = mongoose.model(
  "ReviewRecord",
  reviewRecordSchema
);

export default ReviewRecord;
