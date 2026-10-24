
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#245642] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1c4433] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-[#DFE6DE] bg-white px-4 py-2.5 text-sm font-medium text-[#294538] hover:bg-[#F1F5F0]";

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

  // Support responses where findings are nested inside "analysis".
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
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (severity.includes("medium") || severity.includes("warning")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-[#DFE6DE] bg-[#F1F5F0] text-[#52665A]";
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
    item?.severity ?? item?.risk_level ?? item?.riskLevel ?? item?.priority ?? "Information"
  );
}

function ResultCard({ label, value, detail }) {
  return (
    <article className="rounded-2xl border border-[#DFE6DE] bg-white p-5">
      <p className="text-sm text-[#68786D]">{label}</p>
      <p className="mt-3 break-words text-2xl font-semibold text-[#294538]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#879188]">{detail}</p>
    </article>
  );
}

function DataSection({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-[#DFE6DE] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[#294538]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#758278]">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function AnalysisResults() {
  const { id } = useParams();
  useEffect(() => {
  if (id) {
    localStorage.setItem("lastDocumentId", id);
  }
}, [id]);
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
    if (!localStorage.getItem("token")) return;

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

    if (ids.length < 2) {
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

setConsistencyResult(
  payload?.analysis ?? payload
);
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
      <main className="min-h-screen bg-[#FAFBF9] p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-8 w-72 animate-pulse rounded bg-[#E8EDE7]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[#F1F5F0]" />
          <div className="h-56 animate-pulse rounded-2xl bg-[#F1F5F0]" />
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen bg-[#FAFBF9] px-5 py-16 text-[#20392D]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#DFE6DE] bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Analysis unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[#68786D]">{error}</p>
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
    <main className="min-h-screen bg-[#FAFBF9] text-[#20392D]">
      <header className="border-b border-[#DFE6DE] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#245642] text-lg font-semibold text-white">
              S
            </span>
            <span>
              <span className="block text-base font-semibold">SeeAstra AI</span>
              <span className="block text-xs text-[#758278]">
                Analysis and consistency review
              </span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-3">
            <Link to="/dashboard" className={secondaryButton}>
              Dashboard
            </Link>
            <Link to="/documents" className={secondaryButton}>
              Documents
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
        <Link
          to={`/documents/${id}`}
          className="text-sm font-medium text-[#52745F] hover:underline"
        >
          ← Back to document details
        </Link>

        <section className="rounded-2xl border border-[#DFE6DE] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#52745F]">
                ANALYSIS REPORT
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold sm:text-3xl">
                {safeText(documentName)}
              </h1>
              <p className="mt-3 text-sm text-[#758278]">
                Review extracted information, possible issues and consistency
                results before making a decision.
              </p>
              <p className="mt-2 break-all text-xs text-[#879188]">
                ID: {safeText(getId(document) || id)}
              </p>
            </div>

            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className={primaryButton}
            >
              {analyzing ? "Running analysis..." : "↻ Run analysis"}
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
          >
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResultCard
            label="Document status"
            value={humanize(documentStatus)}
            detail="Current status from the backend"
          />
          <ResultCard
            label="Findings"
            value={findings.length}
            detail="Items returned by the analysis response"
          />
          <ResultCard
            label="Missing fields"
            value={missingFields.length}
            detail="Potentially incomplete information"
          />
          <ResultCard
            label="Analysis status"
            value={humanize(analysisStatus)}
            detail="Status reported by the analysis service"
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DataSection
            title="Extracted fields"
            description="Information returned by the document extraction service."
          >
            {extractedFields.length ? (
              <dl className="divide-y divide-[#EEF1EC]">
                {extractedFields.map(([key, value], index) => (
                  <div
                    key={`${key}-${index}`}
                    className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm font-medium text-[#52665A]">
                      {humanize(key)}
                    </dt>
                    <dd className="break-words text-sm leading-6 text-[#294538] sm:col-span-2">
                      {safeText(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="rounded-xl bg-[#F1F5F0] p-4 text-sm leading-6 text-[#68786D]">
                No extracted fields were returned. Run analysis or verify the
                extraction response in the backend.
              </p>
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
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                  >
                    <p className="text-sm font-medium text-amber-900">
                      {findingTitle(item, index)}
                    </p>
                    {typeof item === "object" && item !== null && (
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        {findingDescription(item)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-[#F1F5F0] p-4 text-sm leading-6 text-[#68786D]">
                No missing fields were reported. This alone does not prove the
                document is complete.
              </p>
            )}
          </DataSection>
        </div>

        <DataSection
          title="AI findings"
          description="Potential issues for human verification. These findings are not final regulatory decisions."
        >
          {findings.length ? (
            <div className="space-y-3">
              {findings.map((item, index) => (
                <article
                  key={item?._id ?? item?.id ?? index}
                  className="rounded-xl border border-[#E8EDE7] p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold text-[#294538]">
                        {findingTitle(item, index)}
                      </h3>
                      <p className="mt-2 break-words text-sm leading-6 text-[#68786D]">
                        {findingDescription(item)}
                      </p>
                    </div>
                    <span
                      className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs ${severityStyle(findingSeverity(item))}`}
                    >
                      {humanize(findingSeverity(item))}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-[#F1F5F0] p-5 text-sm leading-6 text-[#68786D]">
              No findings are available in the recognized response fields.
              Confirm that analysis has completed and inspect the saved
              analysisResult if you expected findings here.
            </p>
          )}
        </DataSection>

        <DataSection
          title="Cross-document consistency check"
          description="Select other processed documents to compare their extracted fields with this document. The backend validates ownership and eligibility."
        >
          <p className="mb-4 text-sm text-[#52665A]">
            Current document is included automatically. Select at least one
            additional document; up to 50 documents can be checked together.
          </p>

          {loadingDocuments ? (
            <p className="text-sm text-[#758278]">Loading documents...</p>
          ) : eligibleDocuments.length ? (
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-[#DFE6DE] p-3">
              {eligibleDocuments.map((item) => {
                const documentId = String(getId(item));
                const checked = selectedIds.includes(documentId);

                return (
                  <label
                    key={documentId}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-[#F1F5F0]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDocument(documentId)}
                      className="mt-1 h-4 w-4 accent-[#245642]"
                    />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium text-[#294538]">
                        {safeText(getName(item))}
                      </span>
                      <span className="mt-1 block text-xs text-[#879188]">
                        Status: {humanize(item.status ?? "Unknown")}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-[#F1F5F0] p-4 text-sm leading-6 text-[#68786D]">
              No other potentially processed documents were found in the
              document list. Upload and analyze another document first.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={runConsistencyCheck}
              disabled={checking || selectedIds.length === 0}
              className={primaryButton}
            >
              {checking ? "Checking consistency..." : "Check consistency"}
            </button>
            <span className="text-xs text-[#758278]">
              {selectedIds.length + 1} document
              {selectedIds.length === 0 ? "" : "s"} selected in total
            </span>
          </div>

          {consistencyError && (
            <p role="alert" className="mt-4 text-sm leading-6 text-red-700">
              {consistencyError}
            </p>
          )}

          {consistencyResult && (
            <div className="mt-6 rounded-xl border border-[#DFE6DE] bg-[#FAFBF9] p-5">
              <h3 className="font-semibold text-[#294538]">
                Consistency response
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#758278]">
                Review this response as a report from the backend. Verify
                important discrepancies against the original documents.
              </p>
              <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-4 text-xs leading-5 text-[#294538]">
                {JSON.stringify(consistencyResult, null, 2)}
              </pre>
            </div>
          )}
        </DataSection>

        <footer className="rounded-xl border border-[#DFE6DE] bg-[#F1F5F0] p-5">
          <h2 className="text-sm font-semibold text-[#294538]">
            Human review and auditability
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#617267]">
            AI results support reviewers; they do not establish fraud or
            determine approval or rejection by themselves. Record the final
            decision through the authorised review workflow.
          </p>
        </footer>
      </div>
    </main>
  );
}
