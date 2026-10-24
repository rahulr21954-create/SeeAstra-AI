
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const AUDIT_ENDPOINT = "/audit/me";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getEvents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.auditLogs)) return payload.auditLogs;
  if (Array.isArray(payload?.auditTrail)) return payload.auditTrail;
  if (Array.isArray(payload?.logs)) return payload.logs;
  if (Array.isArray(payload?.items)) return payload.items;
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

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "Activity recorded";
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

  if (value.includes("fail") || value.includes("reject") || value.includes("error")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value.includes("analy") || value.includes("consistency")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (value.includes("review") || value.includes("approv")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (value.includes("upload") || value.includes("create")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-[#DFE6DE] bg-[#F1F5F0] text-[#52665A]";
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

  if (typeof value === "string" || typeof value === "number") {
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

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#245642] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c4433]";

const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-[#DFE6DE] bg-white px-4 py-2.5 text-sm font-medium text-[#294538] transition hover:bg-[#F1F5F0]";

export default function AuditTrail() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditTrail = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(AUDIT_ENDPOINT);
      setEvents(getEvents(unwrap(response)));
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        if (err.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        setError("You do not have permission to view this audit history.");
      } else {
        setError(
          err.response?.data?.message ||
            "Audit history could not be loaded. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAuditTrail();
  }, [loadAuditTrail]);

  const actionOptions = useMemo(() => {
    return [
      ...new Set(events.map((event) => String(eventAction(event)))),
    ].sort();
  }, [events]);

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

  return (
    <main className="min-h-screen bg-[#FAFBF9] text-[#20392D]">
      
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-[#52745F]">
              TRANSPARENCY & TRACEABILITY
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Audit trail
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68786D]">
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
            {loading ? "Refreshing..." : "↻ Refresh history"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm leading-6 text-red-800">{error}</p>
            <button
              type="button"
              onClick={loadAuditTrail}
              className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Recorded events",
              value: events.length,
              description: "Activities returned by the audit API",
            },
            {
              label: "Document uploads",
              value: uploadCount,
              description: "Events whose action indicates an upload",
            },
            {
              label: "Analysis activities",
              value: analysisCount,
              description: "Events whose action indicates analysis",
            },
            {
              label: "Review activities",
              value: reviewCount,
              description: "Events whose action indicates review",
            },
          ].map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-[#DFE6DE] bg-white p-5"
            >
              <p className="text-sm text-[#68786D]">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {loading ? "—" : metric.value}
              </p>
              <p className="mt-2 text-xs text-[#879188]">
                {metric.description}
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#DFE6DE] bg-white">
          <div className="border-b border-[#E8EDE7] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-semibold">Activity history</h2>
                <p className="mt-1 text-sm text-[#758278]">
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
                  className="min-w-0 rounded-lg border border-[#DFE6DE] bg-[#FAFBF9] px-3 py-2.5 text-sm outline-none focus:border-[#7EA58D] sm:w-64"
                />

                <select
                  aria-label="Filter by action"
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  className="rounded-lg border border-[#DFE6DE] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7EA58D]"
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
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-[#F1F5F0]"
                />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="divide-y divide-[#EEF1EC]">
              {filteredEvents.map((event, index) => {
                const action = eventAction(event);
                const documentId = getDocumentId(event);
                const documentName = getDocumentName(event);
                const description = getDescription(event);

                return (
                  <article
                    key={getEventId(event, index)}
                    className="flex gap-4 p-5 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DFE6DE] bg-[#F1F5F0] text-[#245642]">
                      <span aria-hidden="true">◷</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="break-words text-sm font-semibold text-[#294538]">
                            {humanize(action)}
                          </h3>
                          <p className="mt-1 text-xs text-[#758278]">
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
                        <p className="mt-3 break-words text-sm text-[#52665A]">
                          <span className="font-medium">Document:</span>{" "}
                          {documentName}
                        </p>
                      )}

                      {description && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#68786D]">
                          {description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#879188]">
                        <span>
                          Actor: {getActor(event)}
                        </span>

                        {documentId && (
                          <Link
                            to={`/documents/${documentId}`}
                            className="font-semibold text-[#245642] hover:underline"
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
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F5F0] text-2xl text-[#245642]">
                ◷
              </div>
              <h3 className="text-lg font-semibold">
                {events.length === 0
                  ? "No audit events available"
                  : "No matching events"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#758278]">
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

        <div className="mt-6 rounded-xl border border-[#DFE6DE] bg-[#F1F5F0] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[#294538]">
            Audit integrity
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#617267]">
            This page displays events supplied by the backend. A reliable audit
            trail should be recorded server-side with timestamps, actor identity
            and relevant resource IDs, and should not be editable by ordinary
            users.
          </p>
        </div>
      </div>
    </main>
  );
}
