
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const getId = (doc) =>
  doc?._id || doc?.id || doc?.documentId || "";

const getDocumentName = (doc) =>
  doc?.originalName ||
  doc?.filename ||
  doc?.name ||
  "Untitled document";

const getFindings = (doc) => {
  if (Array.isArray(doc?.findings)) {
    return doc.findings.map((item, index) => ({
      ...(item?.finding && typeof item.finding === "object"
        ? item.finding
        : {}),
      findingIndex: item?.findingIndex ?? index,
      review: item?.review ?? null,
    }));
  }

  const result = doc?.analysisResult || doc?.analysis || {};
  const analysis = result?.analysis || result;
  const findings =
    analysis?.findings ||
    analysis?.issues ||
    analysis?.results?.findings ||
    [];

  return Array.isArray(findings)
    ? findings.map((finding, index) => ({
        ...(typeof finding === "object" && finding !== null
          ? finding
          : { description: String(finding) }),
        findingIndex: index,
        review: null,
      }))
    : [];
};

const getFindingTitle = (finding, index) =>
  finding?.title ||
  finding?.field ||
  finding?.name ||
  finding?.type ||
  `Finding ${index + 1}`;

const getFindingDescription = (finding) => {
  const value =
    finding?.description ||
    finding?.message ||
    finding?.reason ||
    finding?.details ||
    "No additional explanation was provided.";

  return typeof value === "string"
    ? value
    : JSON.stringify(value);
};

const getDecision = (finding) =>
  finding?.review?.decision ||
  finding?.reviewStatus ||
  finding?.review_status ||
  "pending";

const getNotes = (finding) =>
  finding?.review?.reviewerNotes ||
  finding?.reviewerNotes ||
  "";

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  const styles = {
    processed: "bg-emerald-50 text-emerald-800",
    confirmed: "bg-emerald-50 text-emerald-800",
    dismissed: "bg-slate-100 text-slate-700",
    pending: "bg-amber-50 text-amber-800",
    failed: "bg-rose-50 text-rose-800",
    processing: "bg-blue-50 text-blue-800",
    uploaded: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[normalized] || "bg-slate-100 text-slate-700"
      }`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

export default function ReviewerDecision() {
  const navigate = useNavigate();
  const { documentId } = useParams();

  const [queue, setQueue] = useState([]);
  const [selectedId, setSelectedId] = useState(documentId || "");
  const [analysisDocument, setAnalysisDocument] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [comments, setComments] = useState({});
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [savingIndex, setSavingIndex] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setError("");

    try {
      const response = await api.get("/reviews/queue");
      const data = response.data;

      const items = Array.isArray(data)
        ? data
        : data?.documents || data?.queue || [];

      setQueue(items);

      setSelectedId((currentId) => {
        if (
          currentId &&
          items.some(
            (item) => String(getId(item)) === String(currentId)
          )
        ) {
          return currentId;
        }

        return documentId || (items.length ? String(getId(items[0])) : "");
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load the reviewer queue. Check reviewer/admin access."
      );
    } finally {
      setLoadingQueue(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const queueDocument = useMemo(
    () =>
      queue.find(
        (item) => String(getId(item)) === String(selectedId)
      ) || null,
    [queue, selectedId]
  );

  useEffect(() => {
    if (!selectedId) {
      setAnalysisDocument(null);
      return;
    }

    let active = true;

    async function loadDocument() {
      setLoadingDocument(true);
      setError("");
      setNotice("");
      setAnalysisDocument(null);

      try {
        const response = await api.get(
          `/documents/${selectedId}/analysis`
        );

        if (!active) return;

        const doc = response.data?.document || response.data;
        setAnalysisDocument(doc);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            "Unable to load document analysis."
        );
      } finally {
        if (active) setLoadingDocument(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
    };
  }, [selectedId]);

  const document = useMemo(() => {
    if (!queueDocument) return analysisDocument;
    if (!analysisDocument) return queueDocument;

    return {
      ...analysisDocument,
      ...queueDocument,
      analysisResult:
        analysisDocument.analysisResult ||
        queueDocument.analysisResult,
    };
  }, [analysisDocument, queueDocument]);

  const findings = useMemo(() => getFindings(document), [document]);

  useEffect(() => {
    if (!selectedId) return;

    setDecisions((previous) => {
      const next = { ...previous };

      findings.forEach((finding) => {
        const index = finding.findingIndex;
        if (next[index] === undefined) {
          next[index] = getDecision(finding);
        }
      });

      return next;
    });

    setComments((previous) => {
      const next = { ...previous };

      findings.forEach((finding) => {
        const index = finding.findingIndex;
        if (next[index] === undefined) {
          next[index] = getNotes(finding);
        }
      });

      return next;
    });
  }, [selectedId, findings]);

  const filteredQueue = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return queue;

    return queue.filter((item) =>
      getDocumentName(item).toLowerCase().includes(query)
    );
  }, [queue, search]);

  const reviewedCount = findings.filter((finding) => {
    const decision =
      decisions[finding.findingIndex] ?? getDecision(finding);

    return ["confirmed", "dismissed"].includes(decision);
  }).length;

  async function saveFinding(index, decision) {
    if (!selectedId || savingIndex !== null) return;

    setSavingIndex(index);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/reviews/${selectedId}/findings/${index}`,
        {
          decision,
          reviewerNotes: comments[index] || "",
        }
      );

      setDecisions((previous) => ({
        ...previous,
        [index]: decision,
      }));

      setNotice(
        response.data?.message || "Finding review saved successfully."
      );

      await loadQueue();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save review. Please try again."
      );
    } finally {
      setSavingIndex(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#20392D]">
      <header className="border-b border-[#DFE6DE] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm font-semibold text-[#245642] hover:underline"
            >
              ← SeeAstra AI
            </button>
            <h1 className="mt-2 text-xl font-bold sm:text-2xl">
              Reviewer verification
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review AI findings and record verification outcomes.
            </p>
          </div>

          <button
            onClick={loadQueue}
            disabled={loadingQueue}
            className="rounded-lg border border-[#DFE6DE] px-4 py-2 text-sm font-semibold hover:bg-[#F1F5F0] disabled:opacity-50"
          >
            {loadingQueue ? "Refreshing..." : "Refresh queue"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-2xl border border-[#DFE6DE] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Review queue</h2>
            <span className="rounded-full bg-[#F1F5F0] px-2.5 py-1 text-xs font-semibold">
              {queue.length} documents
            </span>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents..."
            className="mt-4 w-full rounded-lg border border-[#DFE6DE] px-3 py-2.5 text-sm outline-none focus:border-[#36866D]"
          />

          <div className="mt-4 space-y-2">
            {loadingQueue && (
              <p className="py-6 text-center text-sm text-slate-500">
                Loading reviewer queue...
              </p>
            )}

            {!loadingQueue && filteredQueue.length === 0 && (
              <div className="rounded-xl bg-[#F7F9F7] p-5 text-center">
                <p className="text-sm font-semibold">No documents found</p>
                <p className="mt-1 text-xs text-slate-500">
                  Processed documents containing findings appear here.
                </p>
              </div>
            )}

            {filteredQueue.map((item) => {
              const id = String(getId(item));
              const active = id === String(selectedId);

              return (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedId(id);
                    navigate(`/reviews/${id}`, { replace: true });
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[#245642] bg-[#F1F5F0]"
                      : "border-transparent hover:border-[#DFE6DE] hover:bg-[#FAFBF9]"
                  }`}
                >
                  <p className="break-words text-sm font-semibold">
                    {getDocumentName(item)}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      {item.findings?.length || 0} findings
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.analyzedAt
                        ? new Date(item.analyzedAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
            >
              {notice}
            </div>
          )}

          {!selectedId && !loadingQueue && (
            <div className="rounded-2xl border border-[#DFE6DE] bg-white p-10 text-center">
              <h2 className="font-bold">No document selected</h2>
              <p className="mt-2 text-sm text-slate-500">
                Select a document from the reviewer queue.
              </p>
            </div>
          )}

          {selectedId && (
            <>
              <div className="rounded-2xl border border-[#DFE6DE] bg-white p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#557464]">
                  Selected document
                </p>

                <h2 className="mt-2 break-words text-lg font-bold sm:text-xl">
                  {getDocumentName(document)}
                </h2>

                <p className="mt-2 break-all text-xs text-slate-500">
                  Document ID: {selectedId}
                </p>

                {loadingDocument ? (
                  <p className="mt-6 text-sm text-slate-500">
                    Loading document analysis...
                  </p>
                ) : (
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-[#F7F9F7] p-4">
                      <p className="text-xs text-slate-500">Total findings</p>
                      <p className="mt-2 text-2xl font-bold">
                        {findings.length}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F7F9F7] p-4">
                      <p className="text-xs text-slate-500">Reviewed</p>
                      <p className="mt-2 text-2xl font-bold">
                        {reviewedCount}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F7F9F7] p-4">
                      <p className="text-xs text-slate-500">Remaining</p>
                      <p className="mt-2 text-2xl font-bold">
                        {Math.max(0, findings.length - reviewedCount)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {!loadingDocument && findings.length === 0 && (
                <div className="rounded-2xl border border-[#DFE6DE] bg-white p-8">
                  <h3 className="font-bold">No findings available</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This document may not contain findings, or the analysis
                    response has a different structure.
                  </p>
                </div>
              )}

              {!loadingDocument &&
                findings.map((finding) => {
                  const index = finding.findingIndex;
                  const decision =
                    decisions[index] ?? getDecision(finding);

                  return (
                    <article
                      key={`${selectedId}-${index}`}
                      className="rounded-2xl border border-[#DFE6DE] bg-white p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F0] text-sm font-bold text-[#245642]">
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <h3 className="break-words font-bold">
                              {getFindingTitle(finding, index)}
                            </h3>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                              {getFindingDescription(finding)}
                            </p>
                          </div>
                        </div>

                        <StatusBadge status={decision} />
                      </div>

                      {finding.severity && (
                        <p className="mt-3 text-xs text-slate-500">
                          Severity: {String(finding.severity)}
                        </p>
                      )}

                      {finding.evidence && (
                        <div className="mt-4 rounded-lg bg-[#F7F9F7] p-3">
                          <p className="text-xs font-semibold text-[#245642]">
                            Evidence
                          </p>
                          <p className="mt-1 break-words text-sm text-slate-600">
                            {typeof finding.evidence === "string"
                              ? finding.evidence
                              : JSON.stringify(finding.evidence)}
                          </p>
                        </div>
                      )}

                      <label className="mt-5 block text-sm font-semibold">
                        Reviewer notes
                        <textarea
                          maxLength={2000}
                          value={comments[index] ?? ""}
                          onChange={(event) =>
                            setComments((previous) => ({
                              ...previous,
                              [index]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Explain your verification decision..."
                          className="mt-2 w-full resize-y rounded-lg border border-[#DFE6DE] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#36866D]"
                        />
                        <span className="mt-1 block text-right text-xs font-normal text-slate-500">
                          {(comments[index] || "").length}/2000
                        </span>
                      </label>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          disabled={savingIndex !== null}
                          onClick={() => saveFinding(index, "confirmed")}
                          className="rounded-lg bg-[#245642] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B4432] disabled:opacity-50"
                        >
                          {savingIndex === index
                            ? "Saving..."
                            : "Confirm finding"}
                        </button>

                        <button
                          disabled={savingIndex !== null}
                          onClick={() => saveFinding(index, "dismissed")}
                          className="rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Dismiss finding
                        </button>

                        <button
                          disabled={savingIndex !== null}
                          onClick={() => saveFinding(index, "pending")}
                          className="rounded-lg border border-[#DFE6DE] px-4 py-2.5 text-sm font-semibold hover:bg-[#F1F5F0] disabled:opacity-50"
                        >
                          Mark pending
                        </button>
                      </div>
                    </article>
                  );
                })}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
