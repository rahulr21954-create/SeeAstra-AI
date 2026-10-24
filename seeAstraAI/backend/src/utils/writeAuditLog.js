import AuditLog from "../models/AuditLog.js";

export async function writeAuditLog({
  actor,
  action,
  documentIds = [],
  outcome = "success",
  details = {},
}) {
  try {
    await AuditLog.create({
      actor,
      action,
      documentIds,
      outcome,
      details,
    });
  } catch (error) {
    // Do not log document contents, tokens, or sensitive data.
    console.error("Audit log write failed:", error.message);

    throw new Error("Unable to record audit event");
  }
}