import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const AUDIT_ENDPOINT = "/audit/me";

const theme = {
  navy: "#20364B",
  navyHover: "#172A3B",
  dustyBlue: "#B7C9D9",
  steelBlue: "#D2DEE8",
  background: "#B7C9D9",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  text: "#29333D",
  textMuted: "#637282",
  textSoft: "#7A8794",
};

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getEvents(payload) {
  if (Array.isArray(payload)) return payload;

  for (const key of ["events", "auditLogs", "auditTrail", "logs", "items"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
}

function humanize(value) {
  return String(value || "Activity")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function eventAction(event) {
  const value =
    event?.action ??
    event?.eventType ??
    event?.event_type ??
    event?.type ??
    "Activity recorded";

  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "Activity recorded";
}

function eventDate(event) {
  return (
    event?.createdAt ||
    event?.created_at ||
    event?.timestamp ||
    event?.date ||
    null
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function getDocumentName(event) {
  return (
    event?.document?.originalName ||
    event?.document?.original_name ||
    event?.document?.filename ||
    event?.documentName ||
    event?.document_name ||
    event?.metadata?.documentName ||
    event?.metadata?.filename ||
    ""
  );
}

function getDocumentId(event) {
  return (
    event?.document?._id ||
    event?.document?.id ||
    event?.documentId ||
    event?.document_id ||
    ""
  );
}

function actionStyle(action) {
  const value = String(action).toLowerCase();

  if (
    value.includes("fail") ||
    value.includes("reject") ||
    value.includes("error")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value.includes("analy") || value.includes("consistency")) {
    return "border-[#B7C9D9] bg-[#EAF0F5] text-[#20364B]";
  }

  if (value.includes("review") || value.includes("approv")) {
    return "border-amber-200 bg-amber-50 text-[#A86416]";
  }

  if (value.includes("upload") || value.includes("create")) {
    return "border-[#B7D6C3] bg-[#EDF6F0] text-[#397454]";
  }

  return "border-[#D2DEE8] bg-[#F3F6F9] text-[#52677B]";
}

function getActor(event) {
  const actor =
    event?.user?.name ||
    event?.user?.email ||
    event?.actor?.name ||
    event?.actor?.email ||
    event?.performedBy?.name ||
    event?.performedBy?.email ||
    event?.userName ||
    event?.user_name ||
    "";

  if (actor) return actor;

  if (typeof event?.user === "string") return event.user;
  if (typeof event?.actor === "string") return event.actor;

  return "Actor not provided";
}

function getDescription(event) {
  const value =
    event?.description ??
    event?.message ??
    event?.details ??
    event?.metadata?.description ??
    "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? JSON.stringify(item)
          : String(item)
      )
      .join(", ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        const formattedKey = humanize(key);
        const formattedValue =
          typeof item === "object" && item !== null
            ? JSON.stringify(item)
            : String(item);

        return `${formattedKey}: ${formattedValue}`;
      })
      .join(" | ");
  }

  return "";
}

function getEventId(event, index) {
  return event?._id || event?.id || `${eventAction(event)}-${index}`;
}

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#D2DEE8] bg-white px-4 py-2.5 text-sm font-medium text-[#20364B] transition-colors hover:border-[#B7C9D9] hover:bg-[#F0F4F8] focus:outline-none focus:ring-2 focus:ring-[#B7C9D9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const inputStyle =
  "min-w-0 rounded-lg border border-[#D2DEE8] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#29333D] outline-none transition placeholder:text-[#8A96A2] focus:border-[#7896B0] focus:ring-2 focus:ring-[#B7C9D9]/50";

export default function AuditTrail() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");

  const loadAuditTrail = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setErrorDetails("");

    try {
      const response = await api.get(AUDIT_ENDPOINT);
      setEvents(getEvents(unwrap(response)));
    } catch (err) {
      const status = err.response?.status;
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.details;

      if (status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (status === 403) {
        setError(
          serverMessage ||
            "Access denied. Your account is authenticated, but the backend is not allowing access to this audit history."
        );
        setErrorDetails(
          "Check the /audit/me route permissions, authentication middleware and the role assigned to your account."
        );
      } else if (status === 404) {
        setError(
          serverMessage ||
            "The audit endpoint was not found. Check the backend route configuration."
        );
        setErrorDetails(`Requested endpoint: ${AUDIT_ENDPOINT}`);
      } else {
        setError(
          serverMessage ||
            "Audit history could not be loaded. Please try again."
        );

        if (status) {
          setErrorDetails(`Request failed with HTTP ${status}.`);
        } else if (err.request) {
          setErrorDetails(
            "The server did not respond. Check whether the backend is running and the API URL is correct."
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAuditTrail();
  }, [loadAuditTrail]);

  const actionOptions = useMemo(
    () =>
      [...new Set(events.map((event) => String(eventAction(event))))].sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const action = String(eventAction(event));
        const documentName = getDocumentName(event);
        const actor = getActor(event);
        const description = getDescription(event);
        const documentId = String(getDocumentId(event));

        const matchesSearch =
          !query ||
          action.toLowerCase().includes(query) ||
          documentName.toLowerCase().includes(query) ||
          actor.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          documentId.toLowerCase().includes(query);

        const matchesAction =
          actionFilter === "all" || action === actionFilter;

        return matchesSearch && matchesAction;
      })
      .sort((a, b) => {
        const dateA = new Date(eventDate(a) || 0).getTime();
        const dateB = new Date(eventDate(b) || 0).getTime();
        return dateB - dateA;
      });
  }, [events, search, actionFilter]);

  const uploadCount = events.filter((event) =>
    String(eventAction(event)).toLowerCase().includes("upload")
  ).length;

  const analysisCount = events.filter((event) =>
    String(eventAction(event)).toLowerCase().includes("analy")
  ).length;

  const reviewCount = events.filter((event) =>
    String(eventAction(event)).toLowerCase().includes("review")
  ).length;

  const metrics = [
    {
      label: "Recorded events",
      value: events.length,
      description: "Activities returned by the audit API",
      icon: "A",
    },
    {
      label: "Document uploads",
      value: uploadCount,
      description: "Events whose action indicates an upload",
      icon: "U",
    },
    {
      label: "Analysis activities",
      value: analysisCount,
      description: "Events whose action indicates analysis",
      icon: "N",
    },
    {
      label: "Review activities",
      value: reviewCount,
      description: "Events whose action indicates review",
      icon: "R",
    },
  ];

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        {/* Page heading */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-7 rounded-full bg-[#7896B0]" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526D86]">
                Transparency &amp; traceability
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#20364B] sm:text-4xl">
              Audit trail
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#637282]">
              Review recorded activities associated with document processing
              and the review workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAuditTrail}
            disabled={loading}
            className={secondaryButton}
          >
            <span aria-hidden="true" className="text-base">↻</span>
            {loading ? "Refreshing..." : "Refresh history"}
          </button>
        </header>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-sm font-bold text-red-700">
                !
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Could not load audit history
                </p>

                <p className="mt-1 break-words text-sm leading-6 text-red-800">
                  {error}
                </p>

                {errorDetails && (
                  <p className="mt-2 text-xs leading-5 text-red-700">
                    {errorDetails}
                  </p>
                )}

                <button
                  type="button"
                  onClick={loadAuditTrail}
                  disabled={loading}
                  className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-4 disabled:opacity-60"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <section
          aria-label="Audit summary"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="group rounded-2xl border border-[#D2DEE8] bg-white p-5 shadow-[0_2px_8px_rgba(32,54,75,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B7C9D9] hover:shadow-[0_8px_24px_rgba(32,54,75,0.07)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-[#637282]">
                  {metric.label}
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D2DEE8] bg-[#EDF2F6] text-xs font-bold text-[#20364B] transition-colors group-hover:bg-[#DCE6EF]">
                  {metric.icon}
                </span>
              </div>

              <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-[#20364B]">
                {loading ? "—" : metric.value}
              </p>

              <p className="mt-2 text-xs leading-5 text-[#7A8794]">
                {metric.description}
              </p>
            </article>
          ))}
        </section>

        {/* Activity history */}
        <section className="overflow-hidden rounded-2xl border border-[#D2DEE8] bg-white shadow-[0_2px_10px_rgba(32,54,75,0.025)]">
          <div className="border-b border-[#E3EAF0] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-semibold text-[#20364B]">
                  Activity history
                </h2>

                <p className="mt-1 text-sm text-[#7A8794]">
                  {loading
                    ? "Loading recorded events..."
                    : `${filteredEvents.length} of ${events.length} events shown`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="search"
                  aria-label="Search audit events"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search activity or document"
                  className={`${inputStyle} sm:w-64`}
                />

                <select
                  aria-label="Filter by action"
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  className={`${inputStyle} sm:w-48`}
                >
                  <option value="all">All activities</option>

                  {actionOptions.map((action) => (
                    <option key={action} value={action}>
                      {humanize(action)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl border border-[#E4EBF1] bg-[#F1F5F8]"
                />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="divide-y divide-[#EAF0F4]">
              {filteredEvents.map((event, index) => {
                const action = eventAction(event);
                const documentId = getDocumentId(event);
                const documentName = getDocumentName(event);
                const description = getDescription(event);

                return (
                  <article
                    key={getEventId(event, index)}
                    className="flex gap-3 p-4 transition-colors hover:bg-[#F8FAFC] sm:gap-4 sm:px-6 sm:py-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D2DEE8] bg-[#EDF2F6] text-lg text-[#20364B]">
                      <span aria-hidden="true">◷</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="break-words text-sm font-semibold text-[#20364B]">
                            {humanize(action)}
                          </h3>

                          <p className="mt-1 text-xs text-[#7A8794]">
                            {formatDate(eventDate(event))}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${actionStyle(action)}`}
                        >
                          {humanize(action)}
                        </span>
                      </div>

                      {documentName && (
                        <p className="mt-3 break-words text-sm text-[#526273]">
                          <span className="font-medium text-[#29333D]">
                            Document:
                          </span>{" "}
                          {documentName}
                        </p>
                      )}

                      {description && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#637282]">
                          {description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#7A8794]">
                        <span>
                          <span className="font-medium text-[#526273]">
                            Actor:
                          </span>{" "}
                          {getActor(event)}
                        </span>

                        {documentId && (
                          <Link
                            to={`/documents/${documentId}`}
                            className="font-semibold text-[#345873] underline-offset-4 transition-colors hover:text-[#20364B] hover:underline"
                          >
                            Open document →
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-16 text-center sm:px-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D2DEE8] bg-[#EDF2F6] text-2xl text-[#20364B]">
                ◷
              </div>

              <h3 className="text-lg font-semibold text-[#20364B]">
                {events.length === 0
                  ? "No audit events available"
                  : "No matching events"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7A8794]">
                {events.length === 0
                  ? "The audit API returned no events. Activities will appear here only when the backend records them."
                  : "Try a different search term or activity filter."}
              </p>

              {events.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActionFilter("all");
                  }}
                  className={`${secondaryButton} mt-5`}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* Audit integrity note */}
        <section className="mt-6 rounded-2xl border border-[#D2DEE8] bg-[#EAF0F5] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D2DEE8] bg-white text-sm font-semibold text-[#20364B]">
              i
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#20364B]">
                Audit integrity
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#526273]">
                This page displays events supplied by the backend. A reliable
                audit trail should be recorded server-side with timestamps,
                actor identity and relevant resource IDs, and should not be
                editable by ordinary users.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-6 border-t border-[#D2DEE8] pt-4">
          <p className="text-center text-xs text-[#7A8794]">
            SeeAstra AI · Audit &amp; traceability
          </p>
        </footer>
      </div>
    </main>
  );
}

