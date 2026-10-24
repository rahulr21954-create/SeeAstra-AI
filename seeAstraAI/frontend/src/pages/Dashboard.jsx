
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function getDocumentStatus(document) {
  return (
    document.status ||
    document.processingStatus ||
    document.analysisStatus ||
    "Uploaded"
  );
}

function StatusLabel({ status }) {
  const value = String(status || "Uploaded");
  const normalized = value.toLowerCase();

  let style = "border-[#DCE3DC] bg-[#F3F5F2] text-[#58675E]";

  if (["processed", "completed", "analyzed", "approved"].includes(normalized)) {
    style = "border-[#D5E5D8] bg-[#F0F7F0] text-[#326344]";
  } else if (
    ["failed", "rejected", "error"].includes(normalized)
  ) {
    style = "border-[#E8CFCB] bg-[#FBF2F0] text-[#994A40]";
  } else if (
    ["processing", "pending", "in_review", "under_review"].includes(normalized)
  ) {
    style = "border-[#E8DCC7] bg-[#FBF8F1] text-[#926B37]";
  }

  return (
    <span className={`inline-flex rounded border px-2.5 py-1 text-xs font-medium ${style}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Metric({ label, value, description, loading }) {
  return (
    <div className="border-t-2 border-[#A8BEAC] bg-white px-5 py-5">
      <p className="text-sm text-[#718077]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#20392D]">
        {loading ? "—" : value}
      </p>
      <p className="mt-2 text-xs text-[#89948B]">{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [workflowResult, documentsResult] = await Promise.all([
        api.get("/workflow/me"),
        api.get("/documents"),
      ]);

      const workflowPayload = workflowResult.data?.data || workflowResult.data;
      const documentPayload = documentsResult.data?.data || documentsResult.data;

      const workflow =
        workflowPayload?.workflow ||
        workflowPayload?.summary ||
        workflowPayload;

      const documentList = Array.isArray(documentPayload)
        ? documentPayload
        : documentPayload?.documents ||
          documentPayload?.items ||
          [];

      setSummary(workflow || {});
      setDocuments(documentList);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, [loadDashboard, navigate]);

  const totalDocuments =
    summary?.totalDocuments ?? summary?.total ?? documents.length;

  const processingDocuments =
    summary?.processing ?? documents.filter((doc) =>
      ["processing", "uploaded", "pending"].includes(
        String(getDocumentStatus(doc)).toLowerCase()
      )
    ).length;

  const processedDocuments =
    summary?.processed ?? documents.filter((doc) =>
      ["processed", "completed", "analyzed"].includes(
        String(getDocumentStatus(doc)).toLowerCase()
      )
    ).length;

  const pendingReviews = summary?.pendingReviews ?? summary?.pending ?? "—";
  const recentDocuments = documents.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#FAFBF9] text-[#24372F]">
      {/* Header */}
      

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#39735D]">
              Overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20392D] sm:text-4xl">
              Review dashboard
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#718077]">
              Monitor document processing and keep track of items that
              may need further review.
            </p>
          </div>

          <Link
            to="/documents/upload"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-[#245642] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1B4635]"
          >
            <span aria-hidden="true">+</span>
            Upload document
          </Link>
        </div>

        {error && (
          <div className="mt-7 flex flex-col justify-between gap-3 rounded-md border border-[#E8CFCB] bg-[#FBF2F0] p-4 sm:flex-row sm:items-center">
            <p role="alert" className="text-sm text-[#994A40]">{error}</p>
            <button
              onClick={loadDashboard}
              className="w-fit text-sm font-semibold text-[#994A40] underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Metrics */}
        <section aria-label="Document summary" className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Total documents"
            value={totalDocuments ?? "—"}
            description="Documents in your workspace"
            loading={loading}
          />
          <Metric
            label="Processed"
            value={processedDocuments}
            description="Documents marked as processed"
            loading={loading}
          />
          <Metric
            label="In progress"
            value={processingDocuments}
            description="Uploaded or processing"
            loading={loading}
          />
          <Metric
            label="Pending reviews"
            value={pendingReviews}
            description="As reported by the workflow service"
            loading={loading}
          />
        </section>

        {/* Recent documents */}
        <section className="mt-10 overflow-hidden border border-[#DFE6DE] bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-[#E3E8E2] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-[#2B4435]">
                Recent documents
              </h2>
              <p className="mt-1 text-sm text-[#849087]">
                Recently added files and their current status.
              </p>
            </div>
            <Link
              to="/documents"
              className="text-sm font-semibold text-[#397052] hover:underline"
            >
              View all documents →
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-[#718077]">
              Loading documents...
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F4EF] text-xl text-[#547263]">
                +
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#2B4435]">
                No documents yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#718077]">
                Upload an application PDF or supporting document to begin
                your review workflow.
              </p>
              <Link
                to="/documents/upload"
                className="mt-5 inline-flex rounded-md bg-[#245642] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1B4635]"
              >
                Upload your first document
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-[#F5F7F3]">
                  <tr className="text-xs font-medium uppercase tracking-wide text-[#77847A]">
                    <th className="px-6 py-3.5">Document</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Uploaded</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECE6]">
                  {recentDocuments.map((doc) => {
                    const id = doc._id || doc.id;
                    const name =
                      doc.originalName ||
                      doc.originalFilename ||
                      doc.fileName ||
                      doc.filename ||
                      doc.title ||
                      "Untitled document";

                    const dateValue =
                      doc.createdAt || doc.uploadedAt || doc.created_at;

                    const date = dateValue
                      ? new Date(dateValue).toLocaleDateString()
                      : "—";

                    return (
                      <tr key={id || name} className="transition hover:bg-[#FAFBF9]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#F0F4EF] text-[10px] font-semibold text-[#547263]">
                              PDF
                            </span>
                            <span className="max-w-xs truncate text-sm font-medium text-[#35483C]">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusLabel status={getDocumentStatus(doc)} />
                        </td>
                        <td className="px-6 py-4 text-sm text-[#718077]">
                          {date}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {id ? (
                            <Link
                              to={`/documents/${id}`}
                              className="text-sm font-semibold text-[#397052] hover:underline"
                            >
                              Open
                            </Link>
                          ) : (
                            <span className="text-sm text-[#89948B]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Review note */}
        <div className="mt-6 border-l-2 border-[#A8BEAC] bg-[#F1F5F0] px-5 py-4">
          <p className="text-sm font-medium text-[#365543]">
            Reviewer guidance
          </p>
          <p className="mt-1 text-sm leading-6 text-[#718077]">
            Automated findings are intended to support verification.
            Check the original documents before recording a review decision.
          </p>
        </div>
      </div>
    </main>
  );
}
