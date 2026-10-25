import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const QUEUE_ENDPOINT = "/reviews/queue";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reviews)) return payload.reviews;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.queue)) return payload.queue;
  if (Array.isArray(payload?.documents)) return payload.documents;
  return [];
}

function getId(item) {
  const id =
    item?.documentId?._id ||
    item?.documentId?.id ||
    item?.documentId ||
    item?.document_id ||
    item?.document?._id ||
    item?.document?.id ||
    item?._id ||
    item?.id ||
    "";

  return typeof id === "object" ? "" : String(id);
}

function getName(item) {
  const document = item?.document || item;

  return (
    document?.originalName ||
    document?.original_name ||
    document?.filename ||
    document?.fileName ||
    document?.name ||
    "Application document"
  );
}

function getFindings(item) {
  if (Array.isArray(item?.findings)) return item.findings;
  if (Array.isArray(item?.analysis?.findings)) {
    return item.analysis.findings;
  }
  return [];
}

function getSeverity(item) {
  const findings = getFindings(item);
  const explicit = item?.severity || item?.priority;

  if (explicit) return String(explicit).toLowerCase();
  if (findings.length === 0) return "unrated";

  const levels = findings.map((finding) =>
    String(finding?.severity || finding?.level || "").toLowerCase()
  );

  if (levels.some((level) => ["critical", "high"].includes(level))) {
    return "high";
  }

  if (
    levels.some((level) =>
      ["medium", "moderate", "warning"].includes(level)
    )
  ) {
    return "medium";
  }

  if (
    levels.some((level) =>
      ["low", "info", "informational"].includes(level)
    )
  ) {
    return "low";
  }

  return "unrated";
}

function getStatus(item) {
  return String(
    item?.reviewStatus ||
      item?.review_status ||
      item?.status ||
      item?.document?.status ||
      "pending"
  ).toLowerCase();
}

function getFinalDecision(item) {
  const decision =
    item?.finalDecision?.status ??
    item?.document?.finalDecision?.status ??
    "not_decided";

  return String(decision).toLowerCase();
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

function severityClasses(severity) {
  if (["critical", "high"].includes(severity)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["medium", "moderate", "warning"].includes(severity)) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (["low", "info", "informational"].includes(severity)) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  return "border-[#D2DEE8] bg-[#EDF2F6] text-[#43586B]";
}

function statusClasses(status) {
  if (["completed", "reviewed", "approved", "processed"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (["rejected", "failed"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["in_progress", "under_review", "processing"].includes(status)) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
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

function humanize(value) {
  return String(value || "Unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#20364B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#304F6B] focus:outline-none focus:ring-2 focus:ring-[#7898B3] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-[#C3D2DF] bg-white px-4 py-2.5 text-sm font-medium text-[#20364B] transition hover:bg-[#EDF3F7] focus:outline-none focus:ring-2 focus:ring-[#7898B3] focus:ring-offset-2";

export default function ReviewerQueue() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState("");

  const loadQueue = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setErrorType("");

    try {
      const response = await api.get(QUEUE_ENDPOINT);
      setItems(getItems(unwrap(response)));
    } catch (err) {
      const statusCode = err.response?.status;
      const serverMessage = err.response?.data?.message;

      if (statusCode === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (statusCode === 403) {
        setErrorType("permission");
        setError(
          serverMessage ||
            "The server denied access to the reviewer queue. Your account role or the route's permission rules may not allow this request."
        );
      } else if (statusCode === 404) {
        setErrorType("route");
        setError(
          `The endpoint ${QUEUE_ENDPOINT} returned 404. Check whether the backend review route is registered.`
        );
      } else {
        setErrorType("general");
        setError(
          serverMessage ||
            (err.code === "ECONNABORTED"
              ? "The request timed out. Please try again."
              : "The reviewer queue could not be loaded. Please try again.")
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        getName(item).toLowerCase().includes(query) ||
        getId(item).toLowerCase().includes(query);

      const severity = getSeverity(item);
      const status = getStatus(item);

      const matchesSeverity =
        severityFilter === "all" || severity === severityFilter;

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [items, search, severityFilter, statusFilter]);

  const summary = useMemo(
    () => ({
      total: items.length,
      high: items.filter((item) => getSeverity(item) === "high").length,
      medium: items.filter((item) => getSeverity(item) === "medium").length,
      pending: items.filter((item) =>
        ["pending", "uploaded", "under_review", "in_progress"].includes(
          getStatus(item)
        )
      ).length,
      undecided: items.filter(
        (item) => getFinalDecision(item) === "not_decided"
      ).length,
    }),
    [items]
  );

  const metrics = [
    {
      label: "Queue items",
      value: summary.total,
      description: "Applications returned by the review API",
      accent: "border-l-[#20364B]",
    },
    {
      label: "High priority",
      value: summary.high,
      description: "High or critical findings",
      accent: "border-l-[#B83232]",
    },
    {
      label: "Medium priority",
      value: summary.medium,
      description: "Applications with medium findings",
      accent: "border-l-[#A86416]",
    },
    {
      label: "Pending review",
      value: summary.pending,
      description: "Items awaiting review",
      accent: "border-l-[#527FA5]",
    },
    {
      label: "Decision pending",
      value: summary.undecided,
      description: "Applications without a final decision",
      accent: "border-l-[#7898B3]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-[#405F79]">
              APPLICATION REVIEW
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-[#20364B] sm:text-4xl">
              Reviewer queue
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#435565]">
              Review queued applications, inspect AI findings and verify
              important details against the original documents before
              recording a final decision.
            </p>
          </div>

          <button
            type="button"
            onClick={loadQueue}
            disabled={loading}
            className={secondaryButton}
          >
            {loading ? "Refreshing..." : "↻ Refresh queue"}
          </button>
        </div>

        {/* Diagnostic error message */}
        {error && (
          <div
            role="alert"
            className={`mb-6 rounded-xl border p-4 ${
              errorType === "permission"
                ? "border-amber-300 bg-amber-50"
                : errorType === "route"
                  ? "border-blue-200 bg-blue-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                errorType === "permission"
                  ? "text-amber-900"
                  : errorType === "route"
                    ? "text-blue-900"
                    : "text-red-900"
              }`}
            >
              {errorType === "permission"
                ? "Reviewer access denied (403)"
                : errorType === "route"
                  ? "Review route not found (404)"
                  : "Unable to load reviewer queue"}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#435565]">
              {error}
            </p>

            {errorType === "permission" && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-white/70 p-3">
                <p className="text-xs font-semibold text-amber-900">
                  Things to verify
                </p>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">
                  <li>
                    Confirm that the logged-in user has the role required
                    by the backend review route.
                  </li>
                  <li>
                    Check the authentication and role-authorization
                    middleware attached to GET /reviews/queue.
                  </li>
                  <li>
                    Inspect the backend response and server logs for the
                    exact authorization failure.
                  </li>
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={loadQueue}
              disabled={loading}
              className="mt-4 text-sm font-semibold underline underline-offset-4 disabled:opacity-50"
            >
              {loading ? "Retrying..." : "Retry request"}
            </button>
          </div>
        )}

        {/* Summary metrics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className={`rounded-xl border border-[#CAD7E2] border-l-4 ${metric.accent} bg-white p-5 shadow-sm shadow-[#526C82]/5 transition-shadow hover:shadow-md hover:shadow-[#526C82]/10`}
            >
              <p className="text-sm text-[#536777]">{metric.label}</p>

              <p className="mt-3 text-3xl font-semibold tabular-nums text-[#20364B]">
                {loading ? "—" : metric.value}
              </p>

              <p className="mt-2 text-xs leading-5 text-[#71818E]">
                {metric.description}
              </p>
            </article>
          ))}
        </section>

        {/* Queue */}
        <section className="overflow-hidden rounded-2xl border border-[#C5D4E0] bg-white shadow-sm shadow-[#526C82]/5">
          <div className="border-b border-[#DCE5EC] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-semibold text-[#20364B]">
                  Applications awaiting attention
                </h2>

                <p className="mt-1 text-sm text-[#6B7D8B]">
                  {loading
                    ? "Loading queue..."
                    : `${filteredItems.length} of ${items.length} items shown`}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="search"
                  aria-label="Search applications"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search documents..."
                  className="min-w-0 rounded-lg border border-[#C8D6E2] bg-[#F7FAFC] px-3 py-2.5 text-sm outline-none focus:border-[#527FA5] focus:ring-2 focus:ring-[#D2DEE8] sm:w-56"
                />

                <select
                  aria-label="Filter by severity"
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                  className="rounded-lg border border-[#C8D6E2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#527FA5] focus:ring-2 focus:ring-[#D2DEE8]"
                >
                  <option value="all">All severity levels</option>
                  <option value="high">High / Critical</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low / Informational</option>
                  <option value="unrated">Unspecified</option>
                </select>

                <select
                  aria-label="Filter by review status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-[#C8D6E2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#527FA5] focus:ring-2 focus:ring-[#D2DEE8]"
                >
                  <option value="all">All statuses</option>

                  {[...new Set(items.map(getStatus))]
                    .sort()
                    .map((status) => (
                      <option key={status} value={status}>
                        {humanize(status)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-[#EDF2F6]"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#CAD8E4] bg-[#EAF0F5] text-2xl text-[#304F6B]">
                ✓
              </div>

              <h3 className="text-lg font-semibold text-[#20364B]">
                {items.length === 0
                  ? "No queue items available"
                  : "No matching applications"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7D8B]">
                {items.length === 0
                  ? "The review API returned no queue items. Applications generally appear after successful analysis produces findings."
                  : "Try changing your search or filters."}
              </p>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSeverityFilter("all");
                    setStatusFilter("all");
                  }}
                  className={`${secondaryButton} mt-5`}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#E7EDF2]">
              {filteredItems.map((item, index) => {
                const documentId = getId(item);
                const severity = getSeverity(item);
                const status = getStatus(item);
                const finalDecision = getFinalDecision(item);

                const submittedAt =
                  item?.createdAt ||
                  item?.created_at ||
                  item?.submittedAt ||
                  item?.document?.createdAt;

                const findingCount = getFindings(item).length;

                return (
                  <article
                    key={documentId || item?._id || `queue-${index}`}
                    className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-[#F5F8FB] sm:px-6 xl:flex-row xl:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#CAD8E4] bg-[#EAF0F5] text-xs font-bold text-[#304F6B]">
                        PDF
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold text-[#293D4E]">
                          {getName(item)}
                        </h3>

                        <p className="mt-1 text-xs text-[#788996]">
                          {submittedAt
                            ? `Submitted ${formatDate(submittedAt)}`
                            : "Submission date unavailable"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClasses(severity)}`}
                          >
                            {severity === "unrated"
                              ? "Severity unspecified"
                              : `${humanize(severity)} priority`}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}
                          >
                            {humanize(status)}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${decisionClasses(finalDecision)}`}
                          >
                            Decision: {humanize(finalDecision)}
                          </span>

                          <span className="rounded-full border border-[#D2DEE8] bg-[#EDF2F6] px-2.5 py-1 text-xs text-[#43586B]">
                            {findingCount} findings
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {documentId ? (
                        <>
                          <Link
                            to={`/documents/${documentId}`}
                            className={secondaryButton}
                          >
                            Review document
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/applications/${documentId}/decision`
                              )
                            }
                            className={primaryButton}
                          >
                            {finalDecision === "not_decided"
                              ? "Make Final Decision →"
                              : "Update Decision →"}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-[#788996]">
                          Document ID unavailable
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviewer guidance */}
        <div className="mt-6 rounded-xl border border-[#C5D4E0] bg-[#EAF0F5] p-4 sm:p-5">
          <p className="text-sm leading-6 text-[#536777]">
            <strong className="text-[#20364B]">
              Reviewer guidance:
            </strong>{" "}
            AI severity is a prioritization aid, not proof of a document
            defect. Verify findings against source documents and applicable
            requirements. The authorized reviewer makes the final decision.
          </p>
        </div>
      </div>
    </main>
  );
}

