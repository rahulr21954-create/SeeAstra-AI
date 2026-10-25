import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#20364B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#172A3B] focus:outline-none focus:ring-2 focus:ring-[#B7C9D9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-[#D2DEE8] bg-white px-4 py-2.5 text-sm font-medium text-[#20364B] transition hover:border-[#B7C9D9] hover:bg-[#F0F4F8] focus:outline-none focus:ring-2 focus:ring-[#B7C9D9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null
  );
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.findings)) return value.findings;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function humanize(value) {
  return String(value || "Not available")
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

  return JSON.stringify(value);
}

function getStatus(document) {
  return firstValue(
    document?.status,
    document?.reviewStatus,
    document?.review_status,
    document?.analysis?.status,
    "Uploaded"
  );
}

function statusStyle(status) {
  const value = String(status).toLowerCase();

  if (
    value.includes("reject") ||
    value.includes("fail") ||
    value.includes("error")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    value.includes("approv") ||
    value.includes("complete") ||
    value.includes("verified")
  ) {
    return "border-[#B7D6C3] bg-[#EDF6F0] text-[#397454]";
  }

  if (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("processing")
  ) {
    return "border-amber-200 bg-amber-50 text-[#A86416]";
  }

  return "border-[#D2DEE8] bg-[#F3F6F9] text-[#52677B]";
}

function getFindings(document) {
  const analysis = document?.analysis ?? document?.analysisResult ?? {};

  return asArray(
    firstValue(
      document?.findings,
      document?.aiFindings,
      document?.ai_findings,
      analysis?.findings,
      analysis?.issues,
      document?.consistencyResults
    )
  );
}

function getMissingFields(document) {
  const analysis = document?.analysis ?? document?.analysisResult ?? {};

  return asArray(
    firstValue(
      document?.missingFields,
      document?.missing_fields,
      analysis?.missingFields,
      analysis?.missing_fields,
      document?.validation?.missingFields
    )
  );
}

function getExtractedData(document) {
  return firstValue(
    document?.extractedData,
    document?.extracted_data,
    document?.extractedFields,
    document?.extracted_fields,
    document?.extraction?.fields,
    document?.analysis?.extractedData,
    {}
  );
}

function getFindingTitle(finding, index) {
  if (typeof finding === "string") return finding;

  return safeText(
    firstValue(
      finding?.title,
      finding?.name,
      finding?.field,
      finding?.type,
      finding?.rule,
      `Finding ${index + 1}`
    )
  );
}

function getFindingDescription(finding) {
  if (typeof finding === "string") return finding;

  return safeText(
    firstValue(
      finding?.description,
      finding?.message,
      finding?.details,
      finding?.reason,
      finding?.explanation,
      finding?.value,
      "No additional explanation provided."
    )
  );
}

function getFindingSeverity(finding) {
  if (!finding || typeof finding !== "object") {
    return "Information";
  }

  return safeText(
    firstValue(
      finding?.severity,
      finding?.riskLevel,
      finding?.risk_level,
      finding?.priority,
      "Information"
    )
  );
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? safeText(value)
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function InfoCard({ label, value, description, icon }) {
  return (
    <article className="group rounded-2xl border border-[#D2DEE8] bg-white p-5 shadow-[0_2px_8px_rgba(32,54,75,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B7C9D9] hover:shadow-[0_8px_24px_rgba(32,54,75,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#637282]">
          {label}
        </p>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D2DEE8] bg-[#EDF2F6] text-xs font-bold text-[#20364B] transition-colors group-hover:bg-[#DCE6EF]">
          {icon}
        </span>
      </div>

      <p className="mt-4 break-words text-xl font-semibold tracking-tight text-[#20364B]">
        {safeText(value)}
      </p>

      {description && (
        <p className="mt-2 text-xs leading-5 text-[#7A8794]">
          {description}
        </p>
      )}
    </article>
  );
}

export default function DocumentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  const loadDocument = useCallback(async () => {
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

    try {
      const response = await api.get(
        `/documents/${encodeURIComponent(id)}/analysis`
      );

      const payload = unwrap(response);
      const result = firstValue(
        payload?.document,
        payload?.item,
        payload
      );

      if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
      ) {
        throw new Error(
          "The server returned an invalid document response."
        );
      }

      setDocument(result);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load this document. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  async function rerunAnalysis() {
    setRetrying(true);
    setError("");

    try {
      const response = await api.post(
        `/documents/${encodeURIComponent(id)}/analyze`
      );

      const payload = unwrap(response);
      const updatedDocument = firstValue(
        payload?.document,
        payload?.item
      );

      if (
        updatedDocument &&
        typeof updatedDocument === "object"
      ) {
        setDocument(updatedDocument);
      } else {
        await loadDocument();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Analysis could not be started. Verify that the analysis endpoint exists."
      );
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-5 w-40 animate-pulse rounded bg-[#D2DEE8]" />
          <div className="h-36 animate-pulse rounded-2xl border border-[#D2DEE8] bg-white" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-[#D2DEE8] bg-white"
              />
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-2xl border border-[#D2DEE8] bg-white" />
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="flex min-h-screen items-start justify-center bg-[#F4F7FA] px-5 py-16 text-[#29333D]">
        <div className="w-full max-w-xl rounded-2xl border border-[#D2DEE8] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D2DEE8] bg-[#EDF2F6] text-2xl text-[#20364B]">
            !
          </div>

          <h1 className="mt-4 text-xl font-semibold text-[#20364B]">
            Document unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#637282]">
            {error || "The requested document could not be found."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={loadDocument}
              className={primaryButton}
            >
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

  const analysis =
    document.analysis ?? document.analysisResult ?? {};

  const findings = getFindings(document);
  const missingFields = getMissingFields(document);
  const extractedData = getExtractedData(document);

  const extractedEntries =
    extractedData &&
    typeof extractedData === "object" &&
    !Array.isArray(extractedData)
      ? Object.entries(extractedData)
      : [];

  const name = firstValue(
    document.originalName,
    document.original_name,
    document.filename,
    document.fileName,
    document.name,
    "Untitled document"
  );

  const status = getStatus(document);

  const uploadedAt = firstValue(
    document.createdAt,
    document.created_at,
    document.uploadedAt,
    document.uploaded_at
  );

  const analysisStatus = firstValue(
    analysis.status,
    document.analysisStatus,
    document.analysis_status,
    "Not available"
  );

  const reviewRequired = firstValue(
    analysis.requiresHumanReview,
    analysis.requires_human_review,
    document.requiresHumanReview,
    document.requires_human_review
  );

  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        {/* Page navigation */}
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#526D86] transition hover:text-[#20364B] hover:underline hover:underline-offset-4"
        >
          <span aria-hidden="true">←</span>
          Back to documents
        </Link>

        {/* Document header */}
        <section className="mt-5 rounded-2xl border border-[#D2DEE8] bg-white p-5 shadow-[0_2px_10px_rgba(32,54,75,0.025)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1 w-7 rounded-full bg-[#7896B0]" />
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#526D86]">
                  Document review
                </p>
              </div>

              <h1 className="break-words text-2xl font-semibold tracking-tight text-[#20364B] sm:text-3xl">
                {safeText(name)}
              </h1>

              <p className="mt-3 text-sm text-[#637282]">
                Uploaded: {formatDate(uploadedAt)}
              </p>

              <p className="mt-1 break-all text-xs text-[#7A8794]">
                Document ID: {safeText(document._id ?? document.id ?? id)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyle(status)}`}
              >
                {humanize(status)}
              </span>

              <button
                type="button"
                onClick={loadDocument}
                disabled={loading}
                className={secondaryButton}
              >
                <span aria-hidden="true">↻</span>
                Refresh
              </button>

              <button
                type="button"
                onClick={rerunAnalysis}
                disabled={retrying}
                className={primaryButton}
              >
                {retrying ? "Starting..." : "Run analysis"}
              </button>
            </div>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          >
            <p className="font-semibold">Something needs attention</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        {/* Overview cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon="D"
            label="Document status"
            value={humanize(status)}
            description="Current status returned by the backend"
          />

          <InfoCard
            icon="F"
            label="AI findings"
            value={findings.length}
            description="Findings available in the returned analysis"
          />

          <InfoCard
            icon="M"
            label="Missing fields"
            value={missingFields.length}
            description="Fields identified as missing"
          />

          <InfoCard
            icon="A"
            label="Analysis status"
            value={humanize(analysisStatus)}
            description="Processing status reported by the backend"
          />
        </section>

        {/* Extracted data and missing fields */}
        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#D2DEE8] bg-white p-5 shadow-[0_2px_10px_rgba(32,54,75,0.02)] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D2DEE8] bg-[#EDF2F6] font-semibold text-[#20364B]">
                E
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#20364B]">
                  Extracted information
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#7A8794]">
                  Fields extracted from the document, when provided by the backend.
                </p>
              </div>
            </div>

            {extractedEntries.length > 0 ? (
              <dl className="mt-5 divide-y divide-[#EAF0F4]">
                {extractedEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm font-medium text-[#526273]">
                      {humanize(key)}
                    </dt>

                    <dd className="break-words text-sm leading-6 text-[#29333D] sm:col-span-2">
                      {safeText(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#D2DEE8] bg-[#F8FAFC] p-5 text-sm leading-6 text-[#637282]">
                No extracted fields were returned. Check whether PDF text
                extraction or OCR has completed in the backend.
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[#D2DEE8] bg-white p-5 shadow-[0_2px_10px_rgba(32,54,75,0.02)] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 font-semibold text-[#A86416]">
                !
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#20364B]">
                  Missing fields
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#7A8794]">
                  Potentially incomplete information that may need attention.
                </p>
              </div>
            </div>

            {missingFields.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {missingFields.map((field, index) => (
                  <li
                    key={`${getFindingTitle(field, index)}-${index}`}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                  >
                    <p className="text-sm font-medium text-amber-900">
                      {getFindingTitle(field, index)}
                    </p>

                    {typeof field === "object" && field !== null && (
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        {getFindingDescription(field)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#D2DEE8] bg-[#F8FAFC] p-5 text-sm leading-6 text-[#637282]">
                No missing fields were reported. This does not by itself
                establish that the document is complete or valid.
              </div>
            )}
          </article>
        </section>

        {/* AI findings */}
        <section className="mt-6 rounded-2xl border border-[#D2DEE8] bg-white p-5 shadow-[0_2px_10px_rgba(32,54,75,0.02)] sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D2DEE8] bg-[#EDF2F6] font-semibold text-[#20364B]">
                  AI
                </div>

                <h2 className="text-lg font-semibold text-[#20364B]">
                  AI findings and consistency checks
                </h2>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#637282]">
                Review potential issues identified by the system. AI findings
                are suggestions for verification, not final regulatory decisions.
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#D2DEE8] bg-[#EDF2F6] px-3 py-1.5 text-xs font-medium text-[#20364B]">
              {findings.length} finding{findings.length === 1 ? "" : "s"}
            </span>
          </div>

          {findings.length > 0 ? (
            <div className="mt-6 space-y-4">
              {findings.map((finding, index) => (
                <article
                  key={
                    typeof finding === "object" && finding !== null
                      ? finding._id ?? finding.id ?? index
                      : index
                  }
                  className="rounded-xl border border-[#D2DEE8] bg-[#FCFDFE] p-4 transition-colors hover:border-[#B7C9D9] sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="break-words text-sm font-semibold text-[#20364B]">
                        {getFindingTitle(finding, index)}
                      </h3>

                      <p className="mt-2 break-words text-sm leading-6 text-[#637282]">
                        {getFindingDescription(finding)}
                      </p>
                    </div>

                    <span className="w-fit shrink-0 rounded-full border border-[#D2DEE8] bg-[#EDF2F6] px-3 py-1 text-xs text-[#526273]">
                      {humanize(getFindingSeverity(finding))}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-[#D2DEE8] bg-[#F8FAFC] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#D2DEE8] bg-[#EDF2F6] text-xl text-[#20364B]">
                ✓
              </div>

              <h3 className="mt-3 font-semibold text-[#20364B]">
                No findings available
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#7A8794]">
                The backend has not returned any findings for this document.
                This may mean analysis has not run, is still processing, or
                the response uses a different field structure.
              </p>
            </div>
          )}

          {/* Human review notice */}
          <div className="mt-6 rounded-xl border border-[#D2DEE8] bg-[#EAF0F5] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D2DEE8] bg-white font-semibold text-[#20364B]">
                i
              </div>

              <div>
                <p className="text-sm font-semibold text-[#20364B]">
                  Human verification
                </p>

                <p className="mt-1 text-sm leading-6 text-[#526273]">
                  {reviewRequired === true
                    ? "The backend indicates that human review is required."
                    : reviewRequired === false
                      ? "The backend indicates that human review is not flagged as required. Follow your organisation's review policy."
                      : "Review requirement was not specified by the backend. A reviewer should verify important findings before making a decision."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Review integrity */}
        <footer className="mt-6 rounded-2xl border border-[#D2DEE8] bg-[#EAF0F5] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D2DEE8] bg-white font-semibold text-[#20364B]">
              i
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#20364B]">
                Review integrity
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#526273]">
                This page displays information returned by the backend. Missing
                fields or inconsistencies should be verified against the original
                documents. AI output alone should not determine approval or rejection.
              </p>
            </div>
          </div>
        </footer>

        <div className="mt-6 border-t border-[#D2DEE8] pt-4">
          <p className="text-center text-xs text-[#7A8794]">
            SeeAstra AI · Document verification &amp; compliance
          </p>
        </div>
      </div>
    </main>
  );
}

