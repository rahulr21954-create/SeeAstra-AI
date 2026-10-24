import AuditLog from "../models/AuditLog.js";

export async function getMyAuditHistory(req, res) {
  try {
    const logs = await AuditLog.find({
      actor: req.user._id,
    })
      .select("action documentIds outcome details createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Audit history fetch failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch audit history",
    });
  }
}