
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["failed", "error", "rejected"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["processing", "analyzing", "in_progress"].includes(status)) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    ["pending_review", "under_review", "pending", "uploaded"].includes(
      status
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[#DFE6DE] bg-[#F1F5F0] text-[#52665A]";
}

function decisionClasses(status) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "correction_requested":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-[#DFE6DE] bg-[#F1F5F0] text-[#52665A]";
  }
}

const buttonPrimary =
  "inline-flex items-center justify-center rounded-lg bg-[#245642] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c4433]";

const buttonSecondary =
  "inline-flex items-center justify-center rounded-lg border border-[#DFE6DE] bg-white px-4 py-2.5 text-sm font-medium text-[#294538] transition hover:bg-[#F1F5F0]";

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
        <span className="text-xs text-[#879188]">
          Document ID unavailable
        </span>
      );
    }

    const encodedId = encodeURIComponent(documentId);

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={`/documents/${encodedId}`}
          className="text-sm font-semibold text-[#245642] hover:underline"
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
    <main className="min-h-screen bg-[#FAFBF9] text-[#20392D]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-[#52745F]">
              DOCUMENT MANAGEMENT
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Documents
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68786D]">
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

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total documents",
              value: summary.total,
              description: "Documents returned by the API",
            },
            {
              label: "Processed",
              value: summary.processed,
              description: "Documents marked as analyzed",
            },
            {
              label: "In progress",
              value: summary.processing,
              description: "Currently being processed",
            },
            {
              label: "Pending",
              value: summary.pending,
              description: "Uploaded or awaiting review",
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[#DFE6DE] bg-white p-5"
            >
              <p className="text-sm text-[#68786D]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {loading ? "—" : item.value}
              </p>
              <p className="mt-2 text-xs text-[#879188]">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#DFE6DE] bg-white">
          <div className="border-b border-[#E8EDE7] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-semibold">All documents</h2>
                <p className="mt-1 text-sm text-[#758278]">
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
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#879188]">
                    ⌕
                  </span>
                  <input
                    id="document-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search document name or ID"
                    className="w-full rounded-lg border border-[#DFE6DE] bg-[#FAFBF9] py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#9AA49B] focus:border-[#7EA58D] focus:bg-white"
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
                    className="w-full rounded-lg border border-[#DFE6DE] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7EA58D]"
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

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-[#F1F5F0]"
                />
              ))}
            </div>
          ) : filteredDocuments.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#F8FAF7]">
                    <tr className="border-b border-[#E8EDE7] text-xs font-medium uppercase tracking-wide text-[#758278]">
                      <th className="px-6 py-4">Document</th>
                      <th className="px-6 py-4">Uploaded</th>
                      <th className="px-6 py-4">Analysis status</th>
                      <th className="px-6 py-4">Final decision</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEF1EC]">
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
                          className="transition hover:bg-[#FBFCFA]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#DFE6DE] bg-[#F1F5F0] text-xs font-semibold text-[#245642]">
                                PDF
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-sm truncate text-sm font-medium text-[#294538]">
                                  {getDocumentName(document)}
                                </p>
                                <p className="mt-1 text-xs text-[#879188]">
                                  {documentId
                                    ? `ID: ${String(documentId).slice(-12)}`
                                    : "Document ID unavailable"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm text-[#68786D]">
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
                      className="rounded-xl border border-[#E5EAE3] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F0] text-xs font-semibold text-[#245642]">
                          PDF
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-semibold">
                            {getDocumentName(document)}
                          </h3>
                          <p className="mt-1 text-xs text-[#879188]">
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
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F5F0] text-2xl text-[#245642]">
                ▤
              </div>

              <h3 className="text-lg font-semibold">
                {documents.length === 0
                  ? "No documents uploaded yet"
                  : "No matching documents"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#758278]">
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
