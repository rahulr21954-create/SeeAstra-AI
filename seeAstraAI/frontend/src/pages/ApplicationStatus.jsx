import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const stages = [
  {
    id: "submitted",
    title: "Application submitted",
    description: "The document has been received.",
  },
  {
    id: "analysis",
    title: "Document analysis",
    description:
      "The system extracts information and checks for potential issues.",
  },
  {
    id: "review",
    title: "Reviewer assessment",
    description: "A reviewer verifies the findings.",
  },
  {
    id: "decision",
    title: "Final decision",
    description: "The reviewer records the application outcome.",
  },
];

function getProgress(application) {
  const stage = application.currentStage;

  if (stage === "analysis_failed") return 1;
  if (stage === "analysis_pending" || stage === "analyzing") return 1;
  if (stage === "under_review") return 2;

  if (
    ["approved", "correction_requested", "rejected"].includes(stage)
  ) {
    return 4;
  }

  return 0;
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function stageLabel(stage) {
  return String(stage || "unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function outcomeClasses(stage) {
  if (stage === "approved") {
    return "border-[#B8D8C5] bg-[#EDF6F0] text-[#397454]";
  }

  if (stage === "rejected") {
    return "border-red-200 bg-red-50 text-[#B83232]";
  }

  if (stage === "correction_requested" || stage === "analysis_failed") {
    return "border-amber-200 bg-amber-50 text-[#A86416]";
  }

  return "border-[#D2DEE8] bg-[#EEF3F7] text-[#486984]";
}

const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-[#D2DEE8] bg-white px-4 py-2.5 text-sm font-medium text-[#20364B] transition-colors hover:bg-[#EEF3F7]";

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#20364B] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2D4A63]";

export default function ApplicationStatus() {
  const { documentId } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      if (!localStorage.getItem("token")) {
        window.location.assign("/login");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/documents/${encodeURIComponent(documentId)}/status`
        );

        if (active) {
          setApplication(response.data.application);
        }
      } catch (err) {
        if (active) {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.assign("/login");
            return;
          }

          setError(
            err.response?.data?.message ||
              "Unable to load application status."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, [documentId]);

  const progress = application ? getProgress(application) : 0;
  const stage = application?.currentStage;

  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      {/* Deep Navy navigation */}
      

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Page heading */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-md bg-[#E5EDF4] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#486984]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#486984]" />
            Application status
          </span>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#20364B] sm:text-4xl">
            Track your application
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#718092]">
            Follow document processing and review progress in one place.
            Your application timeline updates according to the status
            reported by the system.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-[#D2DEE8] bg-white p-6 sm:p-8">
              <div className="h-5 w-2/5 animate-pulse rounded bg-[#E5EDF4]" />
              <div className="mt-5 h-3 animate-pulse rounded bg-[#EEF3F7]" />
              <div className="mt-4 h-24 animate-pulse rounded-lg bg-[#EEF3F7]" />
            </div>

            <div className="rounded-xl border border-[#D2DEE8] bg-white p-6">
              <div className="h-5 w-1/3 animate-pulse rounded bg-[#E5EDF4]" />
              <div className="mt-6 space-y-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex gap-4">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-[#E5EDF4]" />
                    <div className="flex-1">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-[#EEF3F7]" />
                      <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-[#EEF3F7]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-semibold text-[#A86416]">
                !
              </span>

              <div>
                <h2 className="font-semibold text-[#85520F]">
                  Unable to load application status
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#936B35]">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 text-sm font-semibold text-[#85520F] underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Application information */}
        {!loading && application && (
          <>
            <section className="mt-8 rounded-xl border border-[#D2DEE8] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#718092]">
                    Application document
                  </p>

                  <h2 className="mt-3 break-words text-xl font-semibold text-[#20364B] sm:text-2xl">
                    {application.originalName || "Untitled document"}
                  </h2>

                  <p className="mt-3 text-sm text-[#718092]">
                    Submitted: {formatDate(application.submittedAt)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3 py-2 text-sm font-medium ${outcomeClasses(stage)}`}
                >
                  {stageLabel(stage)}
                </span>
              </div>

              {/* Current update */}
              <div className="mt-7 rounded-lg border border-[#D2DEE8] bg-[#EEF3F7] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#486984]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path
                        d="M12 7v5l3 2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#20364B]">
                      Current update
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#526579]">
                      {application.stageMessage ||
                        "No additional status update is available at this time."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application timeline */}
              <div className="mt-9">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-[#20364B]">
                    Application timeline
                  </h3>

                  <span className="text-xs text-[#8290A0]">
                    {progress} of {stages.length} stages completed
                  </span>
                </div>

                <div className="mt-6 space-y-0">
                  {stages.map((item, index) => {
                    const complete = progress > index;
                    const current =
                      progress === index && progress < 4;

                    const analysisFailed =
                      stage === "analysis_failed" && index === 1;

                    const isLast = index === stages.length - 1;

                    return (
                      <div key={item.id} className="flex gap-4 sm:gap-5">
                        {/* Timeline marker and connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                              analysisFailed
                                ? "border-amber-300 bg-amber-50 text-[#A86416]"
                                : complete
                                  ? "border-[#397454] bg-[#397454] text-white"
                                  : current
                                    ? "border-[#7E9BB5] bg-[#E5EDF4] text-[#20364B]"
                                    : "border-[#D2DEE8] bg-white text-[#8290A0]"
                            }`}
                          >
                            {complete ? (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className="h-4 w-4"
                                aria-hidden="true"
                              >
                                <path
                                  d="m5 12 4 4L19 6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : analysisFailed ? (
                              "!"
                            ) : (
                              index + 1
                            )}
                          </div>

                          {!isLast && (
                            <div
                              className={`my-1 min-h-10 w-px flex-1 ${
                                complete
                                  ? "bg-[#397454]"
                                  : "bg-[#D2DEE8]"
                              }`}
                            />
                          )}
                        </div>

                        {/* Timeline content */}
                        <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-7"}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={`text-sm font-semibold sm:text-base ${
                                current || complete
                                  ? "text-[#20364B]"
                                  : "text-[#647587]"
                              }`}
                            >
                              {item.title}
                            </h4>

                            {current && !analysisFailed && (
                              <span className="rounded-full bg-[#E5EDF4] px-2 py-0.5 text-xs font-medium text-[#486984]">
                                Current stage
                              </span>
                            )}

                            {analysisFailed && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-[#A86416]">
                                Needs attention
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm leading-6 text-[#718092]">
                            {item.description}
                          </p>

                          {index === 0 && (
                            <p className="mt-2 text-xs text-[#8290A0]">
                              {formatDate(application.submittedAt)}
                            </p>
                          )}

                          {index === 1 && (
                            <p className="mt-2 text-xs text-[#8290A0]">
                              {formatDate(application.analyzedAt)}
                            </p>
                          )}

                          {analysisFailed && (
                            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-[#85520F]">
                              Document analysis needs attention. The
                              application may require another analysis
                              attempt or assistance from the authorised team.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Final reviewer decision */}
            {application.finalDecision?.status &&
              application.finalDecision.status !== "not_decided" && (
                <section className="mt-6 rounded-xl border border-[#D2DEE8] bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E5EDF4] text-[#486984]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          d="M8 4h8l4 4v12H4V4h4Zm0 0v5h8V4M8 15l2.5 2.5L16 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <div>
                      <h2 className="text-lg font-semibold text-[#20364B]">
                        Reviewer decision
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[#718092]">
                        The recorded outcome from the review workflow.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#D2DEE8] bg-[#F4F7FA] p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#718092]">
                        Outcome
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${outcomeClasses(
                          application.finalDecision.status
                        )}`}
                      >
                        {stageLabel(application.finalDecision.status)}
                      </span>
                    </div>

                    <div className="rounded-lg border border-[#D2DEE8] bg-[#F4F7FA] p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#718092]">
                        Decision date
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#20364B]">
                        {formatDate(application.finalDecision.decidedAt)}
                      </p>
                    </div>
                  </div>

                  {application.finalDecision.notes && (
                    <div className="mt-4 rounded-lg border border-[#D2DEE8] p-4 sm:p-5">
                      <p className="text-sm font-semibold text-[#20364B]">
                        Reviewer notes
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#526579]">
                        {application.finalDecision.notes}
                      </p>
                    </div>
                  )}
                </section>
              )}

            {/* Page actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/documents" className={secondaryButton}>
                ← Back to documents
              </Link>

              <Link to="/dashboard" className={primaryButton}>
                Dashboard
              </Link>
            </div>

            {/* Responsible AI notice */}
            <footer className="mt-8 rounded-xl border border-[#D2DEE8] bg-[#EAF0F5] p-5">
              <p className="text-sm font-semibold text-[#20364B]">
                About application decisions
              </p>
              <p className="mt-2 text-sm leading-6 text-[#526579]">
                SeeAstra AI provides document-analysis and tracking support.
                Final approval, rejection or correction requests should be
                recorded by authorised reviewers through the appropriate
                workflow.
              </p>
            </footer>
          </>
        )}

        <div className="mt-8 border-t border-[#D2DEE8] pt-5 text-xs text-[#8290A0]">
          SeeAstra AI · Application tracking and compliance review
        </div>
      </div>
    </main>
  );
}

