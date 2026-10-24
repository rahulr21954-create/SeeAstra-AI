
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const decisionOptions = [
  {
    value: "approved",
    label: "Approve application",
    description: "The application is ready for approval.",
  },
  {
    value: "correction_requested",
    label: "Request correction",
    description: "The applicant must correct or complete information.",
  },
  {
    value: "rejected",
    label: "Reject application",
    description: "Record a reason for the rejection.",
  },
];

const statusLabels = {
  not_decided: "Awaiting decision",
  approved: "Approved",
  correction_requested: "Correction requested",
  rejected: "Rejected",
};

const statusStyles = {
  not_decided: "bg-gray-100 text-gray-700",
  approved: "bg-green-100 text-green-800",
  correction_requested: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};

export default function ApplicationDecision() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDecision = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/documents/${documentId}/decision`
      );

      const item = response.data.document;
      setDocument(item);

      const saved = item.finalDecision;

      if (saved?.status && saved.status !== "not_decided") {
        setDecision(saved.status);
        setNotes(saved.notes || "");
      } else {
        setDecision("approved");
        setNotes("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load the application decision."
      );
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDecision();
  }, [loadDecision]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      ["correction_requested", "rejected"].includes(decision) &&
      !notes.trim()
    ) {
      setError("Please enter notes explaining this decision.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${
        decision === "approved"
          ? "approve"
          : decision === "rejected"
            ? "reject"
            : "request corrections for"
      } this application?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await api.patch(
        `/documents/${documentId}/decision`,
        {
          decision,
          notes: notes.trim(),
        }
      );

      setDocument((current) =>
        current
          ? {
              ...current,
              finalDecision: response.data.finalDecision,
            }
          : current
      );

      setMessage(
        response.data.message || "Decision saved successfully."
      );
    } catch (err) {
      const data = err.response?.data;

      if (data?.decisionSaved) {
        setMessage(data.message);
        await loadDecision();
      } else {
        setError(
          data?.message || "Unable to save the decision."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFBF9] p-8 text-[#245642]">
        Loading application decision...
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen bg-[#FAFBF9] p-6 sm:p-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#DFE6DE] bg-white p-6">
          <h1 className="text-xl font-semibold text-[#20392D]">
            Unable to open application
          </h1>
          <p className="mt-3 text-sm text-red-700">{error}</p>
          <button
            onClick={() => navigate("/reviews/queue")}
            className="mt-5 rounded-lg bg-[#245642] px-4 py-2 text-white"
          >
            Back to reviewer queue
          </button>
        </div>
      </main>
    );
  }

  const savedDecision = document.finalDecision || {
    status: "not_decided",
    notes: "",
    decidedAt: null,
  };

  return (
    <main className="min-h-screen bg-[#FAFBF9] px-4 py-8 text-[#20392D] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/reviews/queue")}
          className="mb-6 text-sm font-medium text-[#245642] hover:underline"
        >
          ← Back to reviewer queue
        </button>

        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-[#688173]">
            SeeAstra AI · Human Review
          </p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight">
            Application decision
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#627267]">
            Review the available analysis and record the final
            application-level decision. AI findings are advisory;
            the authorized reviewer makes the decision.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-[#C8DED0] bg-[#F0F7F1] p-4 text-sm text-[#245642]"
          >
            {message}
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-[#DFE6DE] bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#718177]">
                Application document
              </p>
              <h2 className="mt-2 break-words text-lg font-semibold">
                {document.originalName}
              </h2>
              <p className="mt-2 text-sm text-[#718177]">
                Processing status: {document.status}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                statusStyles[savedDecision.status] ||
                statusStyles.not_decided
              }`}
            >
              {statusLabels[savedDecision.status] ||
                statusLabels.not_decided}
            </span>
          </div>

          <button
            onClick={() =>
              navigate(`/documents/${documentId}/analysis`)
            }
            className="mt-5 rounded-lg border border-[#DFE6DE] px-4 py-2 text-sm font-medium text-[#245642] hover:bg-[#F1F5F0]"
          >
            View document analysis
          </button>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#DFE6DE] bg-white p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">
            Record final decision
          </h2>
          <p className="mt-2 text-sm text-[#718177]">
            Your decision and notes will be saved with an audit event.
          </p>

          <fieldset className="mt-6 space-y-3">
            <legend className="mb-3 text-sm font-semibold">
              Select an outcome
            </legend>

            {decisionOptions.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                  decision === option.value
                    ? "border-[#6C9A7E] bg-[#F1F5F0]"
                    : "border-[#DFE6DE] hover:bg-[#FAFBF9]"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={option.value}
                  checked={decision === option.value}
                  onChange={(event) =>
                    setDecision(event.target.value)
                  }
                  className="mt-1 accent-[#245642]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm text-[#718177]">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="mt-6">
            <label
              htmlFor="decision-notes"
              className="mb-2 block text-sm font-semibold"
            >
              Reviewer notes
              {decision !== "approved" && (
                <span className="text-red-600"> *</span>
              )}
            </label>

            <textarea
              id="decision-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Explain the reasons, corrections required, or supporting observations..."
              className="w-full resize-y rounded-xl border border-[#DFE6DE] bg-white px-4 py-3 text-sm outline-none focus:border-[#6C9A7E] focus:ring-2 focus:ring-[#C8DED0]"
            />

            <p className="mt-1 text-right text-xs text-[#718177]">
              {notes.length}/2000 characters
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#245642] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20392D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving decision..." : "Save final decision"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={loadDecision}
              className="rounded-lg border border-[#DFE6DE] px-5 py-3 text-sm font-semibold hover:bg-[#F1F5F0] disabled:opacity-60"
            >
              Reload decision
            </button>
          </div>
        </form>

        <section className="mt-6 rounded-2xl border border-[#DFE6DE] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Last saved decision</h2>
          <p className="mt-3 text-sm">
            <span className="font-medium">Status: </span>
            {statusLabels[savedDecision.status] ||
              statusLabels.not_decided}
          </p>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#627267]">
            {savedDecision.notes || "No reviewer notes recorded."}
          </p>

          {savedDecision.decidedAt && (
            <p className="mt-3 text-xs text-[#718177]">
              Recorded at:{" "}
              {new Date(savedDecision.decidedAt).toLocaleString()}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
