import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "DOCUMENT_UPLOADED",
        "DOCUMENT_ANALYZED",
        "CONSISTENCY_CHECKED",
        "FINDING_REVIEWED",
      ],
    },
    documentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
    }],
    outcome: {
      type: String,
      enum: ["success", "warning", "failure"],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;