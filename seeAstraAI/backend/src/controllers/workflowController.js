
import Document from "../models/Document.js";
import ReviewRecord from "../models/ReviewRecord.js";

export async function getMyWorkflow(req, res) {
  try {
    const documents = await Document.find({
      owner: req.user._id,
    })
      .select(
        "originalName size status analysisResult createdAt analyzedAt"
      )
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const documentIds = documents.map((doc) => doc._id);

    const reviews = await ReviewRecord.find({
      document: { $in: documentIds },
    })
      .select("document findingIndex decision")
      .lean();

    const reviewMap = new Map(
      reviews.map((review) => [
        `${review.document.toString()}:${review.findingIndex}`,
        review.decision,
      ])
    );

    const workflowDocuments = documents.map((doc) => {
      const analysis = doc.analysisResult?.analysis;
      const findings = Array.isArray(analysis?.findings)
        ? analysis.findings
        : [];

      const findingStatuses = findings.map((finding, index) => ({
        findingIndex: index,
        finding,
        reviewStatus:
          reviewMap.get(`${doc._id.toString()}:${index}`) ??
          "pending",
      }));

      return {
        id: doc._id,
        originalName: doc.originalName,
        size: doc.size,
        status: doc.status,
        createdAt: doc.createdAt,
        analyzedAt: doc.analyzedAt,
        analysisSummary: analysis
          ? {
              findingCount:
                analysis.finding_count ?? findings.length,
              requiresHumanReview:
                analysis.requires_human_review ?? false,
            }
          : null,
        findings: findingStatuses,
      };
    });

    const summary = {
      totalDocuments: documents.length,
      uploaded: documents.filter(
        (doc) => doc.status === "uploaded"
      ).length,
      processing: documents.filter(
        (doc) => doc.status === "processing"
      ).length,
      processed: documents.filter(
        (doc) => doc.status === "processed"
      ).length,
      failed: documents.filter(
        (doc) => doc.status === "failed"
      ).length,
      totalFindings: workflowDocuments.reduce(
        (total, doc) => total + doc.findings.length,
        0
      ),
      pendingReviews: workflowDocuments.reduce(
        (total, doc) =>
          total +
          doc.findings.filter(
            (finding) => finding.reviewStatus === "pending"
          ).length,
        0
      ),
    };

    return res.status(200).json({
      success: true,
      summary,
      documents: workflowDocuments,
    });
  } catch (error) {
    console.error("Workflow retrieval failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve application workflow",
    });
  }
}
