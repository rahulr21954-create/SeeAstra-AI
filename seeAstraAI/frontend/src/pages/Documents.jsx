import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getDocuments(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.documents)) return payload.documents;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getDocumentName(document) {
  return (
    document?.originalName ||
    document?.original_name ||
    document?.filename ||
    document?.fileName ||
    document?.name ||
    "Untitled document"
  );
}

function getDocumentId(document) {
  const id =
    document?._id ||
    document?.id ||
    document?.documentId ||
    document?.document_id;

  return typeof id === "object" ? id?._id || id?.id || "" : id || "";
}

function getStatus(document) {
  return String(document?.status || "uploaded").toLowerCase();
}

function getFinalDecision(document) {
  return String(
    document?.finalDecision?.status ||
      document?.final_decision?.status ||
      "not_decided"
  ).toLowerCase();
}

function formatStatus(value) {
  return String(value || "unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function statusClasses(status) {
  if (["processed", "completed", "analyzed"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (["failed", "error", "rejected"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["processing", "analyzing", "in_progress"].includes(status)) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (
    ["pending_review", "under_review", "pending", "uploaded"].includes(
      status
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-[#D2DEE8] bg-[#EDF2F6] text-[#43586B]";
}

function decisionClasses(status) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "correction_requested":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-[#D2DEE8] bg-[#EDF2F6] text-[#43586B]";
  }
}

const buttonPrimary =
  "inline-flex items-center justify-center rounded-lg bg-[#20364B] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#304D66] focus:outline-none focus:ring-2 focus:ring-[#7898B3] focus:ring-offset-2";

const buttonSecondary =
  "inline-flex items-center justify-center rounded-lg border border-[#C3D2DF] bg-white px-4 py-2.5 text-sm font-medium text-[#20364B] transition-colors hover:border-[#9EB5C8] hover:bg-[#EDF3F7] focus:outline-none focus:ring-2 focus:ring-[#7898B3] focus:ring-offset-2";

export default function Documents() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/documents");
      setDocuments(getDocuments(unwrap(response)));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have permission to access these documents.");
      } else {
        setError(
          err.response?.data?.message ||
            "Could not load documents. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const availableStatuses = useMemo(
    () => [...new Set(documents.map(getStatus))].sort(),
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const name = getDocumentName(document).toLowerCase();
      const id = String(getDocumentId(document)).toLowerCase();
      const status = getStatus(document);

      const matchesSearch =
        !query || name.includes(query) || id.includes(query);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: documents.length,
      processed: documents.filter((document) =>
        ["processed", "completed", "analyzed"].includes(getStatus(document))
      ).length,
      processing: documents.filter((document) =>
        ["processing", "analyzing", "in_progress"].includes(
          getStatus(document)
        )
      ).length,
      pending: documents.filter((document) =>
        ["pending", "pending_review", "under_review", "uploaded"].includes(
          getStatus(document)
        )
      ).length,
    }),
    [documents]
  );

  function renderDocumentActions(documentId) {
    if (!documentId) {
      return (
        <span className="text-xs text-[#6F8190]">
          Document ID unavailable
        </span>
      );
    }

    const encodedId = encodeURIComponent(documentId);

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={`/documents/${encodedId}`}
          className="text-sm font-semibold text-[#304F6B] hover:text-[#172A3B] hover:underline"
        >
          Details
        </Link>

        <Link
          to={`/documents/${encodedId}/analysis`}
          className={`${buttonPrimary} px-3 py-2 text-xs`}
        >
          Analysis
        </Link>

        <Link
          to={`/applications/status/${encodedId}`}
          className={`${buttonSecondary} px-3 py-2 text-xs`}
        >
          Track Status
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-[#405F79]">
              DOCUMENT MANAGEMENT
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-[#20364B] sm:text-4xl">
              Documents
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#435565]">
              Manage uploaded application documents, inspect analysis results
              and track application progress from one workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            className={`${buttonSecondary} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={loadDocuments}
              className="font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary metrics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total documents",
              value: summary.total,
              description: "Documents returned by the API",
              accent: "border-l-[#20364B]",
            },
            {
              label: "Processed",
              value: summary.processed,
              description: "Documents marked as analyzed",
              accent: "border-l-[#397454]",
            },
            {
              label: "In progress",
              value: summary.processing,
              description: "Currently being processed",
              accent: "border-l-[#527FA5]",
            },
            {
              label: "Pending",
              value: summary.pending,
              description: "Uploaded or awaiting review",
              accent: "border-l-[#A86416]",
            },
          ].map((item) => (
            <article
              key={item.label}
              className={`rounded-xl border border-[#CAD7E2] border-l-4 ${item.accent} bg-white p-5 shadow-sm shadow-[#526C82]/5 transition-shadow hover:shadow-md hover:shadow-[#526C82]/10`}
            >
              <p className="text-sm font-medium text-[#536777]">
                {item.label}
              </p>

              <p className="mt-3 text-3xl font-semibold tabular-nums text-[#20364B]">
                {loading ? "—" : item.value}
              </p>

              <p className="mt-2 text-xs leading-5 text-[#71818E]">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        {/* Documents table and filters */}
        <section className="overflow-hidden rounded-2xl border border-[#C5D4E0] bg-white shadow-sm shadow-[#526C82]/5">
          <div className="border-b border-[#DCE5EC] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-semibold text-[#20364B]">
                  All documents
                </h2>

                <p className="mt-1 text-sm text-[#6B7D8B]">
                  {loading
                    ? "Loading your documents..."
                    : `${filteredDocuments.length} of ${documents.length} documents shown`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-72">
                  <label htmlFor="document-search" className="sr-only">
                    Search documents
                  </label>

                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#71879A]">
                    ⌕
                  </span>

                  <input
                    id="document-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search document name or ID"
                    className="w-full rounded-lg border border-[#C8D6E2] bg-[#F7FAFC] py-2.5 pl-9 pr-3 text-sm text-[#29333D] outline-none transition placeholder:text-[#8494A1] focus:border-[#527FA5] focus:bg-white focus:ring-2 focus:ring-[#D2DEE8]"
                  />
                </div>

                <div className="sm:w-48">
                  <label htmlFor="status-filter" className="sr-only">
                    Filter by status
                  </label>

                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-lg border border-[#C8D6E2] bg-white px-3 py-2.5 text-sm text-[#29333D] outline-none focus:border-[#527FA5] focus:ring-2 focus:ring-[#D2DEE8]"
                  >
                    <option value="all">All statuses</option>

                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-[#EDF2F6]"
                />
              ))}
            </div>
          ) : filteredDocuments.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#EAF0F5]">
                    <tr className="border-b border-[#D5E0E9] text-xs font-semibold uppercase tracking-wide text-[#536A7D]">
                      <th className="px-6 py-4">Document</th>
                      <th className="px-6 py-4">Uploaded</th>
                      <th className="px-6 py-4">Analysis status</th>
                      <th className="px-6 py-4">Final decision</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E7EDF2]">
                    {filteredDocuments.map((document, index) => {
                      const documentId = getDocumentId(document);
                      const status = getStatus(document);
                      const finalDecision = getFinalDecision(document);
                      const uploadedAt =
                        document?.createdAt ||
                        document?.created_at ||
                        document?.uploadedAt;

                      return (
                        <tr
                          key={
                            documentId ||
                            `${getDocumentName(document)}-${index}`
                          }
                          className="transition-colors hover:bg-[#F5F8FB]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#CAD8E4] bg-[#EAF0F5] text-xs font-bold text-[#304F6B]">
                                PDF
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-sm truncate text-sm font-medium text-[#293D4E]">
                                  {getDocumentName(document)}
                                </p>

                                <p className="mt-1 text-xs text-[#788996]">
                                  {documentId
                                    ? `ID: ${String(documentId).slice(-12)}`
                                    : "Document ID unavailable"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm text-[#536777]">
                            {formatDate(uploadedAt)}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(status)}`}
                            >
                              {formatStatus(status)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${decisionClasses(finalDecision)}`}
                            >
                              {formatStatus(finalDecision)}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="flex flex-wrap justify-end gap-3">
                              {renderDocumentActions(documentId)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile document cards */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredDocuments.map((document, index) => {
                  const documentId = getDocumentId(document);
                  const status = getStatus(document);
                  const finalDecision = getFinalDecision(document);
                  const uploadedAt =
                    document?.createdAt ||
                    document?.created_at ||
                    document?.uploadedAt;

                  const encodedId = documentId
                    ? encodeURIComponent(documentId)
                    : "";

                  return (
                    <article
                      key={
                        documentId ||
                        `${getDocumentName(document)}-${index}`
                      }
                      className="rounded-xl border border-[#D5E0E9] bg-white p-4 transition-colors hover:border-[#AFC3D4]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#CAD8E4] bg-[#EAF0F5] text-xs font-bold text-[#304F6B]">
                          PDF
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-semibold text-[#293D4E]">
                            {getDocumentName(document)}
                          </h3>

                          <p className="mt-1 text-xs text-[#788996]">
                            Uploaded {formatDate(uploadedAt)}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(status)}`}
                            >
                              {formatStatus(status)}
                            </span>

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${decisionClasses(finalDecision)}`}
                            >
                              {formatStatus(finalDecision)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {documentId && (
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <Link
                            to={`/documents/${encodedId}`}
                            className={`${buttonSecondary} w-full`}
                          >
                            View Details
                          </Link>

                          <Link
                            to={`/documents/${encodedId}/analysis`}
                            className={`${buttonPrimary} w-full`}
                          >
                            View Analysis
                          </Link>

                          <Link
                            to={`/applications/status/${encodedId}`}
                            className={`${buttonSecondary} w-full`}
                          >
                            Track Status
                          </Link>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#CAD8E4] bg-[#EAF0F5] text-2xl text-[#304F6B]">
                ▤
              </div>

              <h3 className="text-lg font-semibold text-[#20364B]">
                {documents.length === 0
                  ? "No documents uploaded yet"
                  : "No matching documents"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7D8B]">
                {documents.length === 0
                  ? "Upload an application PDF to begin extraction and AI-assisted review."
                  : "Try another search term or select a different status filter."}
              </p>

              {documents.length === 0 && (
                <Link
                  to="/documents/upload"
                  className={`${buttonPrimary} mt-5`}
                >
                  Upload Document
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

