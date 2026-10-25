import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
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

  let style = "border-[#C7D5E1] bg-[#EFF4F8] text-[#526779]";

  if (
    ["processed", "completed", "analyzed", "approved"].includes(normalized)
  ) {
    style = "border-[#BBD9C5] bg-[#EAF5ED] text-[#28734D]";
  } else if (["failed", "rejected", "error"].includes(normalized)) {
    style = "border-[#E8C5C5] bg-[#FBECEC] text-[#B83232]";
  } else if (
    ["processing", "pending", "in_review", "under_review"].includes(
      normalized
    )
  ) {
    style = "border-[#E9D3B0] bg-[#FFF4E3] text-[#A86416]";
  }

  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Metric({ label, value, description, loading, icon: Icon }) {
  return (
    <div className="group rounded-xl border border-white/80 bg-white p-5 shadow-[0_4px_16px_rgba(32,54,75,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(32,54,75,0.09)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#647789]">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7EFF6] text-[#355D7A]">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-[#20364B]">
        {loading ? "—" : value}
      </p>

      <p className="mt-2 text-xs leading-5 text-[#7A8B99]">
        {description}
      </p>
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

      const workflowPayload =
        workflowResult.data?.data || workflowResult.data;

      const documentPayload =
        documentsResult.data?.data || documentsResult.data;

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
    summary?.processing ??
    documents.filter((doc) =>
      ["processing", "uploaded", "pending"].includes(
        String(getDocumentStatus(doc)).toLowerCase()
      )
    ).length;

  const processedDocuments =
    summary?.processed ??
    documents.filter((doc) =>
      ["processed", "completed", "analyzed"].includes(
        String(getDocumentStatus(doc)).toLowerCase()
      )
    ).length;

  const pendingReviews = summary?.pendingReviews ?? summary?.pending ?? "—";
  const recentDocuments = documents.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-11">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#A3B9CC] bg-white/55 px-3 py-1.5 text-xs font-semibold text-[#294C69]">
              <ShieldCheck size={14} />
              Workspace overview
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#20364B] sm:text-4xl">
              Review dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#40566A]">
              Monitor document processing and keep track of items that may
              need further review.
            </p>
          </div>

          <Link
            to="/documents/upload"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-[#20364B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#14283B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355D7A] focus-visible:ring-offset-2"
          >
            <Upload size={17} />
            Upload document
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-7 flex flex-col justify-between gap-3 rounded-xl border border-[#E8C5C5] bg-[#FBECEC] p-4 sm:flex-row sm:items-center">
            <p role="alert" className="text-sm text-[#A52F36]">
              {error}
            </p>

            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex w-fit items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-[#A52F36] hover:bg-[#F5DDDD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83232]"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        )}

        {/* Metrics */}
        <section
          aria-label="Document summary"
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Metric
            icon={FolderOpen}
            label="Total documents"
            value={totalDocuments ?? "—"}
            description="Documents in your workspace"
            loading={loading}
          />

          <Metric
            icon={CheckCircle2}
            label="Processed"
            value={processedDocuments}
            description="Documents marked as processed"
            loading={loading}
          />

          <Metric
            icon={RefreshCw}
            label="In progress"
            value={processingDocuments}
            description="Uploaded or processing"
            loading={loading}
          />

          <Metric
            icon={FileText}
            label="Pending reviews"
            value={pendingReviews}
            description="As reported by the workflow service"
            loading={loading}
          />
        </section>

        {/* Recent documents */}
        <section className="mt-9 overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_5px_20px_rgba(32,54,75,0.05)]">
          <div className="flex flex-col justify-between gap-3 border-b border-[#E2EAF0] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#20364B]">
                Recent documents
              </h2>

              <p className="mt-1 text-sm text-[#7A8B99]">
                Recently added files and their current status.
              </p>
            </div>

            <Link
              to="/documents"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#355D7A] hover:text-[#20364B] hover:underline"
            >
              View all documents
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <RefreshCw
                size={23}
                className="animate-spin text-[#355D7A]"
              />
              <p className="mt-3 text-sm text-[#647789]">
                Loading documents...
              </p>
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7EFF6] text-[#355D7A]">
                <FolderOpen size={25} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 text-base font-bold text-[#20364B]">
                No documents yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#647789]">
                Upload an application PDF or supporting document to begin
                your review workflow.
              </p>

              <Link
                to="/documents/upload"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#20364B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#14283B]"
              >
                <Upload size={16} />
                Upload your first document
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-[#EAF0F5]">
                  <tr className="text-xs font-bold uppercase tracking-wide text-[#526779]">
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Uploaded</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E6EDF2]">
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
                      <tr
                        key={id || name}
                        className="transition hover:bg-[#F4F8FB]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D7E3ED] bg-[#EAF0F5] text-[#355D7A]">
                              <FileText size={19} strokeWidth={1.7} />
                            </span>

                            <span className="max-w-xs truncate text-sm font-semibold text-[#293D50]">
                              {name}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <StatusLabel status={getDocumentStatus(doc)} />
                        </td>

                        <td className="px-6 py-4 text-sm text-[#647789]">
                          {date}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {id ? (
                            <Link
                              to={`/documents/${id}`}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-[#355D7A] transition hover:bg-[#E7EFF6] hover:text-[#20364B]"
                            >
                              Open
                              <ArrowRight size={14} />
                            </Link>
                          ) : (
                            <span className="text-sm text-[#8999A7]">
                              —
                            </span>
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

        {/* Reviewer guidance */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#A9C0D3] bg-[#D2DEE8] px-5 py-4">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-[#355D7A]"
          />

          <div>
            <p className="text-sm font-bold text-[#20364B]">
              Reviewer guidance
            </p>

            <p className="mt-1 text-sm leading-6 text-[#40566A]">
              Automated findings are intended to support verification.
              Check the original documents before recording a review decision.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

