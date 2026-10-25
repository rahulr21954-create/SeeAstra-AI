import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#20364B] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#2D4A63] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-[#D2DEE8] bg-white px-4 py-2.5 text-sm font-medium text-[#20364B] transition-colors duration-200 hover:bg-[#EEF3F7]";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.documents)) return value.documents;
  if (Array.isArray(value?.findings)) return value.findings;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function humanize(value) {
  return String(value ?? "Not available")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeText(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map(safeText).join(", ");
  }

  return JSON.stringify(value, null, 2);
}

function getId(document) {
  return document?._id ?? document?.id ?? "";
}

function getName(document) {
  return (
    document?.originalName ??
    document?.original_name ??
    document?.filename ??
    document?.fileName ??
    document?.name ??
    "Untitled document"
  );
}

function getAnalysis(document) {
  const result =
    document?.analysisResult ??
    document?.analysis_result ??
    document?.analysis ??
    {};

  if (!result || typeof result !== "object") {
    return {};
  }

  const nestedAnalysis = result.analysis;

  if (
    nestedAnalysis &&
    typeof nestedAnalysis === "object" &&
    !Array.isArray(nestedAnalysis)
  ) {
    return {
      ...result,
      ...nestedAnalysis,
    };
  }

  return result;
}

function getFindings(analysis) {
  return asArray(
    analysis?.findings ??
      analysis?.issues ??
      analysis?.inconsistencies ??
      analysis?.results
  );
}

function getMissingFields(analysis) {
  return asArray(
    analysis?.missing_fields ??
      analysis?.missingFields ??
      analysis?.validation?.missingFields
  );
}

function getExtractedFields(analysis) {
  const fields =
    analysis?.extracted_fields ??
    analysis?.extractedFields ??
    analysis?.extractedData ??
    analysis?.fields ??
    {};

  if (Array.isArray(fields)) {
    return fields.map((item, index) => [
      item?.field ?? item?.name ?? `Field ${index + 1}`,
      item?.value ?? item?.extractedValue ?? item?.text ?? item,
    ]);
  }

  if (fields && typeof fields === "object") {
    return Object.entries(fields);
  }

  return [];
}

function severityStyle(value) {
  const severity = String(value ?? "").toLowerCase();

  if (
    severity.includes("high") ||
    severity.includes("critical") ||
    severity.includes("error")
  ) {
    return "border-red-200 bg-red-50 text-[#B83232]";
  }

  if (severity.includes("medium") || severity.includes("warning")) {
    return "border-amber-200 bg-amber-50 text-[#A86416]";
  }

  return "border-[#D2DEE8] bg-[#EEF3F7] text-[#526579]";
}

function findingTitle(item, index) {
  if (typeof item === "string") return item;

  return safeText(
    item?.title ??
      item?.field ??
      item?.name ??
      item?.type ??
      `Finding ${index + 1}`
  );
}

function findingDescription(item) {
  if (typeof item === "string") return item;

  return safeText(
    item?.description ??
      item?.message ??
      item?.reason ??
      item?.details ??
      item?.explanation ??
      "No explanation was provided."
  );
}

function findingSeverity(item) {
  if (!item || typeof item !== "object") return "Information";

  return safeText(
    item?.severity ??
      item?.risk_level ??
      item?.riskLevel ??
      item?.priority ??
      "Information"
  );
}

function ResultCard({ label, value, detail, accent = false }) {
  return (
    <article className="group rounded-xl border border-[#D2DEE8] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A8BDCF] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#647587]">{label}</p>
        <span
          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
            accent ? "bg-[#A86416]" : "bg-[#7E9BB5]"
          }`}
        />
      </div>

      <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-[#20364B]">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-[#788797]">{detail}</p>
    </article>
  );
}

function DataSection({ title, description, children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-[#D2DEE8] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="border-b border-[#E7EDF2] pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#20364B]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#718092]">
          {description}
        </p>
      </div>

      <div className="pt-5">{children}</div>
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-[#D2DEE8] bg-[#F5F8FA] p-5 text-sm leading-6 text-[#647587]">
      {children}
    </div>
  );
}

export default function AnalysisResults() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [consistencyResult, setConsistencyResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [consistencyError, setConsistencyError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (id) {
      localStorage.setItem("lastDocumentId", id);
    }
  }, [id]);

  const loadAnalysis = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    if (!id) {
      setError("Document ID is missing from the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await api.get(
        `/documents/${encodeURIComponent(id)}/analysis`
      );

      const payload = unwrap(response);
      const result = payload?.document ?? payload?.item;

      if (!result || typeof result !== "object") {
        throw new Error("The server did not return document analysis details.");
      }

      setDocument(result);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ??
          err.message ??
          "Could not load analysis results."
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadDocuments = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setLoadingDocuments(false);
      return;
    }

    setLoadingDocuments(true);

    try {
      const response = await api.get("/documents");
      const payload = unwrap(response);

      const list = asArray(
        Array.isArray(payload)
          ? payload
          : payload?.documents ?? payload?.items ?? payload?.data
      );

      setDocuments(list);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    loadAnalysis();
    loadDocuments();
  }, [loadAnalysis, loadDocuments]);

  const analysis = useMemo(
    () => getAnalysis(document ?? {}),
    [document]
  );

  const findings = useMemo(
    () => getFindings(analysis),
    [analysis]
  );

  const missingFields = useMemo(
    () => getMissingFields(analysis),
    [analysis]
  );

  const extractedFields = useMemo(
    () => getExtractedFields(analysis),
    [analysis]
  );

  const eligibleDocuments = useMemo(() => {
    return documents.filter((item) => {
      const documentId = getId(item);
      const status = String(item?.status ?? "").toLowerCase();
      const result = getAnalysis(item);

      return (
        documentId &&
        documentId !== String(id) &&
        (status.includes("process") ||
          status.includes("complete") ||
          status.includes("analy") ||
          Object.keys(result).length > 0)
      );
    });
  }, [documents, id]);

  function toggleDocument(documentId) {
    setSelectedIds((current) => {
      if (current.includes(documentId)) {
        setConsistencyError("");
        return current.filter((value) => value !== documentId);
      }

      if (current.length >= 49) {
        setConsistencyError("Select no more than 49 additional documents.");
        return current;
      }

      setConsistencyError("");
      return [...current, documentId];
    });
  }

  async function runAnalysis() {
    if (!id) return;

    setAnalyzing(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        `/documents/${encodeURIComponent(id)}/analyze`
      );

      const payload = unwrap(response);

      setNotice(
        payload?.message ??
          "Analysis request completed. Refreshing the saved results."
      );

      await loadAnalysis();
      await loadDocuments();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ??
          "Analysis could not be completed. Check the AI service and backend logs."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function runConsistencyCheck() {
    const ids = [String(id), ...selectedIds.map(String)];

    if (!id || ids.length < 2) {
      setConsistencyError(
        "Select at least one additional document to compare with this document."
      );
      return;
    }

    if (ids.length > 50) {
      setConsistencyError("A maximum of 50 documents can be checked at once.");
      return;
    }

    setChecking(true);
    setConsistencyError("");
    setConsistencyResult(null);

    try {
      const response = await api.post("/documents/check-consistency", {
        documentIds: ids,
      });

      const payload = unwrap(response);
      setConsistencyResult(payload?.analysis ?? payload);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setConsistencyError(
        err.response?.data?.message ??
          "Consistency check failed. Confirm the request body expected by checkMyDocumentsConsistency."
      );
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-16 animate-pulse rounded-xl bg-[#D2DEE8]" />
          <div className="h-36 animate-pulse rounded-xl bg-white" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl bg-white"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-white" />
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F7FA] px-5 py-16 text-[#29333D]">
        <div className="w-full max-w-xl rounded-xl border border-[#D2DEE8] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF3F7] text-[#20364B]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-xl font-semibold text-[#20364B]">
            Analysis unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#718092]">
            {error || "The requested document analysis could not be loaded."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={loadAnalysis} className={primaryButton}>
              Try again
            </button>
            <Link to="/documents" className={secondaryButton}>
              All documents
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const documentName = getName(document);
  const documentStatus = document.status ?? "Uploaded";
  const analysisStatus =
    analysis.status ?? document.analysisStatus ?? "Not specified";

  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      {/* Page header */}
      

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-7 sm:px-8 sm:py-9">
        <Link
          to={`/documents/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#486984] transition-colors hover:text-[#20364B]"
        >
          <span aria-hidden="true">←</span>
          Back to document details
        </Link>

        {/* Report introduction */}
        <section className="rounded-xl border border-[#D2DEE8] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#EEF3F7] px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#486984]">
                  Analysis report
                </span>
                <span className="text-xs text-[#8290A0]">
                  SeeAstra document review
                </span>
              </div>

              <h1 className="mt-4 break-words text-2xl font-semibold tracking-tight text-[#20364B] sm:text-3xl">
                {safeText(documentName)}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#718092]">
                Review extracted information, possible issues and consistency
                results before making a decision.
              </p>

              <p className="mt-3 break-all font-mono text-xs text-[#8290A0]">
                Document ID: {safeText(getId(document) || id)}
              </p>
            </div>

            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className={`${primaryButton} shrink-0`}
            >
              {analyzing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Running analysis...
                </>
              ) : (
                <>
                  <span aria-hidden="true">↻</span>
                  Run analysis
                </>
              )}
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-[#B83232]"
          >
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-lg border border-[#B8D8C5] bg-[#EDF6F0] p-4 text-sm leading-6 text-[#397454]"
          >
            <p className="font-semibold">Analysis update</p>
            <p className="mt-1">{notice}</p>
          </div>
        )}

        {/* Summary metrics */}
        <section aria-label="Analysis summary">
          <div className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#647587]">
              At a glance
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ResultCard
              label="Document status"
              value={humanize(documentStatus)}
              detail="Current status from the backend"
            />
            <ResultCard
              label="AI findings"
              value={findings.length}
              detail="Items returned by the analysis response"
              accent={findings.length > 0}
            />
            <ResultCard
              label="Missing fields"
              value={missingFields.length}
              detail="Potentially incomplete information"
              accent={missingFields.length > 0}
            />
            <ResultCard
              label="Analysis status"
              value={humanize(analysisStatus)}
              detail="Status reported by the analysis service"
            />
          </div>
        </section>

        {/* Extracted data and missing fields */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <DataSection
            title="Extracted fields"
            description="Information returned by the document extraction service."
          >
            {extractedFields.length ? (
              <dl className="divide-y divide-[#E7EDF2]">
                {extractedFields.map(([key, value], index) => (
                  <div
                    key={`${key}-${index}`}
                    className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm font-medium text-[#526579]">
                      {humanize(key)}
                    </dt>
                    <dd className="break-words text-sm leading-6 text-[#29333D] sm:col-span-2">
                      {safeText(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <EmptyState>
                No extracted fields were returned. Run analysis or verify the
                extraction response in the backend.
              </EmptyState>
            )}
          </DataSection>

          <DataSection
            title="Missing fields"
            description="Potential gaps that a reviewer may need to verify."
          >
            {missingFields.length ? (
              <ul className="space-y-3">
                {missingFields.map((item, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-amber-200 bg-amber-50/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-[#A86416]">
                        !
                      </span>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-[#85520F]">
                          {findingTitle(item, index)}
                        </p>

                        {typeof item === "object" && item !== null && (
                          <p className="mt-1 break-words text-sm leading-6 text-[#936B35]">
                            {findingDescription(item)}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>
                No missing fields were reported. This alone does not prove the
                document is complete.
              </EmptyState>
            )}
          </DataSection>
        </div>

        {/* AI findings */}
        <DataSection
          title="AI findings"
          description="Potential issues for human verification. These findings are not final regulatory decisions."
        >
          {findings.length ? (
            <div className="space-y-3">
              {findings.map((item, index) => (
                <article
                  key={item?._id ?? item?.id ?? index}
                  className="rounded-lg border border-[#DCE5ED] p-4 transition-colors hover:bg-[#F9FBFC] sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold text-[#20364B]">
                        {findingTitle(item, index)}
                      </h3>
                      <p className="mt-2 break-words text-sm leading-6 text-[#647587]">
                        {findingDescription(item)}
                      </p>
                    </div>

                    <span
                      className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${severityStyle(
                        findingSeverity(item)
                      )}`}
                    >
                      {humanize(findingSeverity(item))}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState>
              No findings are available in the recognized response fields.
              Confirm that analysis has completed and inspect the saved
              analysisResult if you expected findings here.
            </EmptyState>
          )}
        </DataSection>

        {/* Cross-document consistency */}
        <DataSection
          title="Cross-document consistency check"
          description="Compare extracted fields across documents to help identify possible discrepancies."
        >
          <div className="mb-5 rounded-lg border border-[#D2DEE8] bg-[#F4F7FA] p-4">
            <p className="text-sm leading-6 text-[#526579]">
              The current document is included automatically. Select at least
              one additional document. Up to 50 documents can be checked
              together.
            </p>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#20364B]">
              Available documents
            </h3>
            {!loadingDocuments && (
              <span className="text-xs text-[#8290A0]">
                {eligibleDocuments.length} available
              </span>
            )}
          </div>

          {loadingDocuments ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-lg bg-[#EEF3F7]"
                />
              ))}
            </div>
          ) : eligibleDocuments.length ? (
            <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-[#D2DEE8] bg-white p-2">
              {eligibleDocuments.map((item) => {
                const documentId = String(getId(item));
                const checked = selectedIds.includes(documentId);

                return (
                  <label
                    key={documentId}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      checked
                        ? "border-[#9CB4C9] bg-[#EEF3F7]"
                        : "border-transparent hover:bg-[#F5F8FA]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDocument(documentId)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#20364B]"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-medium text-[#29333D]">
                        {safeText(getName(item))}
                      </span>
                      <span className="mt-1 block text-xs text-[#8290A0]">
                        Status: {humanize(item.status ?? "Unknown")}
                      </span>
                    </span>

                    {checked && (
                      <span className="shrink-0 text-xs font-medium text-[#486984]">
                        Selected
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <EmptyState>
              No other potentially processed documents were found in the
              document list. Upload and analyze another document first.
            </EmptyState>
          )}

          <div className="mt-4 flex flex-col gap-3 border-t border-[#E7EDF2] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-[#647587]">
              <strong className="text-[#20364B]">
                {selectedIds.length + 1}
              </strong>{" "}
              document{selectedIds.length === 0 ? "" : "s"} selected in total
            </span>

            <button
              onClick={runConsistencyCheck}
              disabled={checking || selectedIds.length === 0}
              className={primaryButton}
            >
              {checking ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Checking consistency...
                </>
              ) : (
                "Check consistency"
              )}
            </button>
          </div>

          {consistencyError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-[#B83232]"
            >
              {consistencyError}
            </p>
          )}

          {consistencyResult && (
            <div className="mt-6 overflow-hidden rounded-lg border border-[#D2DEE8]">
              <div className="border-b border-[#D2DEE8] bg-[#EEF3F7] p-4 sm:p-5">
                <h3 className="font-semibold text-[#20364B]">
                  Consistency response
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#647587]">
                  Review the backend report and verify important discrepancies
                  against the original documents.
                </p>
              </div>

              <div className="bg-[#F8FAFC] p-3 sm:p-5">
                <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#DCE5ED] bg-white p-4 font-mono text-xs leading-5 text-[#29333D]">
                  {JSON.stringify(consistencyResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DataSection>

        {/* Human review notice */}
        <footer className="rounded-xl border border-[#D2DEE8] bg-[#EAF0F5] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#486984]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <div>
              <h2 className="text-sm font-semibold text-[#20364B]">
                Human review and auditability
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#526579]">
                AI results support reviewers; they do not establish fraud or
                determine approval or rejection by themselves. Record the
                final decision through the authorised review workflow.
              </p>
            </div>
          </div>
        </footer>

        <div className="flex flex-col justify-between gap-2 border-t border-[#D2DEE8] pt-5 text-xs text-[#8290A0] sm:flex-row sm:items-center">
          <span>SeeAstra AI · Document validation and compliance review</span>
          <span>AI-assisted analysis · Human-led decisions</span>
        </div>
      </div>
    </main>
  );
}

