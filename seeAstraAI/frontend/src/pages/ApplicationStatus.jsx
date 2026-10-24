
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
    description: "The system extracts information and checks for potential issues.",
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
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (stage === "rejected") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (stage === "correction_requested" || stage === "analysis_failed") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-[#DFE6DE] bg-[#F1F5F0] text-[#245642]";
}

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
          `/documents/${documentId}/status`
        );

        if (active) {
          setApplication(response.data.application);
        }
      } catch (err) {
        if (active) {
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
    <main className="min-h-screen bg-[#FAFBF9] text-[#20392D]">
      <header className="border-b border-[#DFE6DE] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#245642] font-semibold text-white">
              S
            </span>
            <span>
              <span className="block font-semibold">SeeAstra AI</span>
              <span className="block text-xs text-[#758278]">
                Application tracking
              </span>
            </span>
          </Link>

          <Link
            to="/documents"
            className="rounded-lg border border-[#DFE6DE] px-4 py-2 text-sm hover:bg-[#F1F5F0]"
          >
            My documents
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-medium text-[#52745F]">
          APPLICATION STATUS
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Track your application
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#68786D]">
          Follow document processing and review progress in one place.
        </p>

        {loading && (
          <div className="mt-8 animate-pulse rounded-2xl border border-[#DFE6DE] bg-white p-8">
            <div className="h-5 w-1/2 rounded bg-[#F1F5F0]" />
            <div className="mt-5 h-3 rounded bg-[#F1F5F0]" />
            <div className="mt-4 h-24 rounded bg-[#F1F5F0]" />
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
          >
            {error}
          </div>
        )}

        {!loading && application && (
          <>
            <section className="mt-8 rounded-2xl border border-[#DFE6DE] bg-white p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="text-sm text-[#758278]">
                    Application document
                  </p>
                  <h2 className="mt-2 break-words text-xl font-semibold">
                    {application.originalName}
                  </h2>
                  <p className="mt-2 text-sm text-[#758278]">
                    Submitted: {formatDate(application.submittedAt)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-2 text-sm font-medium ${outcomeClasses(stage)}`}
                >
                  {stageLabel(stage)}
                </span>
              </div>

              <div className="mt-6 rounded-xl bg-[#F1F5F0] p-4">
                <p className="text-sm font-semibold">
                  Current update
                </p>
                <p className="mt-1 text-sm leading-6 text-[#52665A]">
                  {application.stageMessage}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold">
                  Application timeline
                </h3>

                <div className="mt-6 space-y-6">
                  {stages.map((item, index) => {
                    const complete = progress > index;
                    const current =
                      progress === index && progress < 4;

                    const analysisFailed =
                      stage === "analysis_failed" && index === 1;

                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                              analysisFailed
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : complete
                                  ? "border-[#245642] bg-[#245642] text-white"
                                  : current
                                    ? "border-[#7EA58D] bg-[#F1F5F0] text-[#245642]"
                                    : "border-[#DFE6DE] bg-white text-[#879188]"
                            }`}
                          >
                            {complete ? "✓" : index + 1}
                          </div>

                          {index !== stages.length - 1 && (
                            <div
                              className={`mt-1 min-h-8 w-px ${
                                complete
                                  ? "bg-[#245642]"
                                  : "bg-[#DFE6DE]"
                              }`}
                            />
                          )}
                        </div>

                        <div className="pb-3">
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-[#758278]">
                            {item.description}
                          </p>

                          {index === 0 && (
                            <p className="mt-1 text-xs text-[#879188]">
                              {formatDate(application.submittedAt)}
                            </p>
                          )}

                          {index === 1 && (
                            <p className="mt-1 text-xs text-[#879188]">
                              {formatDate(application.analyzedAt)}
                            </p>
                          )}

                          {analysisFailed && (
                            <p className="mt-2 text-sm text-amber-800">
                              Analysis needs attention.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {application.finalDecision?.status &&
              application.finalDecision.status !== "not_decided" && (
                <section className="mt-6 rounded-2xl border border-[#DFE6DE] bg-white p-6 sm:p-8">
                  <h2 className="text-lg font-semibold">
                    Reviewer decision
                  </h2>

                  <p className="mt-3 text-sm text-[#68786D]">
                    Outcome:{" "}
                    <strong className="text-[#294538]">
                      {stageLabel(application.finalDecision.status)}
                    </strong>
                  </p>

                  <p className="mt-2 text-sm text-[#68786D]">
                    Decision date:{" "}
                    {formatDate(application.finalDecision.decidedAt)}
                  </p>

                  {application.finalDecision.notes && (
                    <div className="mt-4 rounded-xl bg-[#F1F5F0] p-4">
                      <p className="text-sm font-semibold">
                        Reviewer notes
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52665A]">
                        {application.finalDecision.notes}
                      </p>
                    </div>
                  )}
                </section>
              )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/documents" className="rounded-lg border border-[#DFE6DE] bg-white px-4 py-2.5 text-sm font-medium hover:bg-[#F1F5F0]">
                Back to documents
              </Link>

              <Link to="/dashboard" className="rounded-lg bg-[#245642] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1c4433]">
                Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
