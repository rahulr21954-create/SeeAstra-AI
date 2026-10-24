
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#245642] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c4433] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-[#DFE6DE] bg-white px-4 py-2.5 text-sm font-medium text-[#294538] transition hover:bg-[#F1F5F0]";

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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("processing")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[#DFE6DE] bg-[#F1F5F0] text-[#52665A]";
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
  if (!finding || typeof finding !== "object") return "Information";

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

function InfoCard({ label, value, description }) {
  return (
    <article className="rounded-2xl border border-[#DFE6DE] bg-white p-5">
      <p className="text-sm text-[#68786D]">{label}</p>
      <p className="mt-2 break-words text-base font-semibold text-[#294538]">
        {safeText(value)}
      </p>
      {description && (
        <p className="mt-2 text-xs leading-5 text-[#879188]">
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

      if (!result || typeof result !== "object" || Array.isArray(result)) {
        throw new Error("The server returned an invalid document response.");
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
      // This endpoint must exist in your backend.
      const response = await api.post(
        `/documents/${encodeURIComponent(id)}/analyze`
      );

      const payload = unwrap(response);
      const updatedDocument = firstValue(
        payload?.document,
        payload?.item
      );

      if (updatedDocument && typeof updatedDocument === "object") {
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
      <main className="min-h-screen bg-[#FAFBF9] p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-[#E8EDE7]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[#F1F5F0]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#F1F5F0]" />
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen bg-[#FAFBF9] px-5 py-16 text-[#20392D]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#DFE6DE] bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Document unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[#68786D]">
            {error || "The requested document could not be found."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={loadDocument} className={primaryButton}>
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
    <main className="min-h-screen bg-[#FAFBF9] text-[#20392D]">
      

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <Link
          to="/documents"
          className="text-sm font-medium text-[#52745F] hover:underline"
        >
          ← Back to documents
        </Link>

        <section className="mt-5 rounded-2xl border border-[#DFE6DE] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#52745F]">
                DOCUMENT REVIEW
              </p>

              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {safeText(name)}
              </h1>

              <p className="mt-3 text-sm text-[#758278]">
                Uploaded: {formatDate(uploadedAt)}
              </p>

              <p className="mt-1 break-all text-xs text-[#879188]">
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
                ↻ Refresh
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

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          >
            {error}
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label="Document status"
            value={humanize(status)}
            description="Current status returned by the backend"
          />
          <InfoCard
            label="AI findings"
            value={findings.length}
            description="Findings available in the returned analysis"
          />
          <InfoCard
            label="Missing fields"
            value={missingFields.length}
            description="Fields identified as missing"
          />
          <InfoCard
            label="Analysis status"
            value={humanize(analysisStatus)}
            description="Processing status reported by the backend"
          />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#DFE6DE] bg-white p-6">
            <h2 className="text-lg font-semibold">
              Extracted information
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#758278]">
              Fields extracted from the document, when provided by the backend.
            </p>

            {extractedEntries.length > 0 ? (
              <dl className="mt-5 divide-y divide-[#EEF1EC]">
                {extractedEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4"
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
              <div className="mt-5 rounded-xl bg-[#F1F5F0] p-5 text-sm leading-6 text-[#68786D]">
                No extracted fields were returned. Check whether PDF text
                extraction or OCR has completed in the backend.
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[#DFE6DE] bg-white p-6">
            <h2 className="text-lg font-semibold">Missing fields</h2>
            <p className="mt-1 text-sm leading-6 text-[#758278]">
              Potentially incomplete information that may need attention.
            </p>

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
              <div className="mt-5 rounded-xl bg-[#F1F5F0] p-5 text-sm leading-6 text-[#68786D]">
                No missing fields were reported. This does not by itself
                establish that the document is complete or valid.
              </div>
            )}
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-[#DFE6DE] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold">
                AI findings and consistency checks
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#758278]">
                Review potential issues identified by the system. AI findings
                are suggestions for verification, not final regulatory decisions.
              </p>
            </div>

            <span className="rounded-full border border-[#DFE6DE] bg-[#F1F5F0] px-3 py-1.5 text-xs font-medium text-[#52665A]">
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
                  className="rounded-xl border border-[#E8EDE7] p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="break-words text-sm font-semibold text-[#294538]">
                        {getFindingTitle(finding, index)}
                      </h3>
                      <p className="mt-2 break-words text-sm leading-6 text-[#68786D]">
                        {getFindingDescription(finding)}
                      </p>
                    </div>

                    <span className="w-fit shrink-0 rounded-full border border-[#DFE6DE] bg-[#F1F5F0] px-3 py-1 text-xs text-[#52665A]">
                      {humanize(getFindingSeverity(finding))}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-[#DFE6DE] bg-[#FAFBF9] p-8 text-center">
              <h3 className="font-medium text-[#294538]">
                No findings available
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#758278]">
                The backend has not returned any findings for this document.
                This may mean analysis has not run, is still processing, or
                the response uses a different field structure.
              </p>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Human verification
            </p>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              {reviewRequired === true
                ? "The backend indicates that human review is required."
                : reviewRequired === false
                  ? "The backend indicates that human review is not flagged as required. Follow your organisation's review policy."
                  : "Review requirement was not specified by the backend. A reviewer should verify important findings before making a decision."}
            </p>
          </div>
        </section>

        <footer className="mt-8 rounded-xl border border-[#DFE6DE] bg-[#F1F5F0] p-5">
          <h2 className="text-sm font-semibold text-[#294538]">
            Review integrity
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#617267]">
            This page displays information returned by the backend. Missing
            fields or inconsistencies should be verified against the original
            documents. AI output alone should not determine approval or rejection.
          </p>
        </footer>
      </div>
    </main>
  );
}
