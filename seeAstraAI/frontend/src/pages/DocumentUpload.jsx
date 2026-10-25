import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function DocumentUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectFile = (selectedFile) => {
    setError("");
    setProgress(0);

    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setError("Please select a PDF document.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("File size must be 10 MB or less.");
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setError("The selected file is empty. Please choose another PDF.");
      return;
    }

    setFile(selectedFile);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Choose a PDF document before uploading.");
      return;
    }

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    setUploading(true);
    setProgress(0);

    try {
      const response = await api.post("/documents/upload", formData, {
        timeout: 120000,
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(
              Math.round((event.loaded * 100) / event.total)
            );
          }
        },
      });

      const payload = response.data?.data || response.data;
      const document =
        payload.document ||
        payload.uploadedDocument ||
        payload;

      const documentId = document._id || document.id;

      if (documentId) {
        navigate(`/documents/${documentId}`);
      } else {
        navigate("/documents");
      }
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "The document could not be uploaded. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Page heading */}
        <div className="mb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#405F79]">
            Document management
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20364B] sm:text-4xl">
            Upload a document
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#435565] sm:text-base">
            Add an application document or supporting PDF to begin
            extraction and review.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
          {/* Upload form */}
          <form
            onSubmit={handleUpload}
            className="rounded-2xl border border-[#C5D4E0] bg-white p-5 shadow-sm shadow-[#526C82]/5 sm:p-8"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#20364B]">
                Select your PDF
              </h2>

              <p className="mt-1 text-sm text-[#71818E]">
                Upload one document at a time.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) =>
                selectFile(event.target.files?.[0])
              }
            />

            {/* Drag and drop area */}
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files?.[0]);
              }}
              className={`rounded-xl border-2 border-dashed p-7 text-center transition-colors sm:p-10 ${
                dragging
                  ? "border-[#304F6B] bg-[#E5EEF5]"
                  : "border-[#B8CAD9] bg-[#F6F9FC] hover:border-[#7898B3] hover:bg-[#EFF4F8]"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[#CAD8E4] bg-white text-sm font-bold text-[#304F6B] shadow-sm">
                PDF
              </div>

              <p className="mt-5 text-sm font-semibold text-[#293D4E]">
                Drag and drop your PDF here
              </p>

              <p className="mt-2 text-sm text-[#71818E]">
                or select a file from your device
              </p>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 rounded-lg border border-[#C3D2DF] bg-white px-4 py-2.5 text-sm font-medium text-[#20364B] transition hover:bg-[#EAF0F5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Browse files
              </button>

              <p className="mt-4 text-xs text-[#788996]">
                PDF only · Maximum size 10 MB
              </p>
            </div>

            {/* Selected file */}
            {file && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#CAD8E4] bg-[#F3F7FA] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#CAD8E4] bg-white text-xs font-bold text-[#304F6B]">
                  PDF
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#293D4E]">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-[#71818E]">
                    {formatSize(file.size)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setFile(null);
                    setProgress(0);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="rounded-md px-2 py-1 text-sm font-medium text-[#6C5860] transition hover:bg-[#F9EDED] hover:text-[#A33A3A] disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-medium text-[#536777]">
                  <span>Uploading document</span>
                  <span>{progress}%</span>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-[#E1EAF1]"
                  role="progressbar"
                  aria-label="Document upload progress"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-[#304F6B] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}

            {/* Form actions */}
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#DCE5EC] pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/dashboard"
                className="rounded-lg border border-[#C8D6E2] px-5 py-3 text-center text-sm font-medium text-[#435565] transition hover:bg-[#F1F5F8]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!file || uploading}
                className="rounded-lg bg-[#20364B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#304F6B] focus:outline-none focus:ring-2 focus:ring-[#7898B3] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload document"}
              </button>
            </div>
          </form>

          {/* Guidance sidebar */}
          <aside className="rounded-2xl border border-[#C5D4E0] bg-white p-5 shadow-sm shadow-[#526C82]/5">
            <div className="border-b border-[#DCE5EC] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#52718A]">
                Quick guide
              </p>

              <h2 className="mt-2 text-base font-semibold text-[#20364B]">
                Before you upload
              </h2>
            </div>

            <ul className="mt-5 space-y-5">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF0F5] text-xs font-bold text-[#304F6B]">
                  1
                </span>

                <div>
                  <p className="text-sm font-semibold text-[#293D4E]">
                    Check the file
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#71818E]">
                    Ensure the file is a valid PDF and is within the size limit.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF0F5] text-xs font-bold text-[#304F6B]">
                  2
                </span>

                <div>
                  <p className="text-sm font-semibold text-[#293D4E]">
                    Review extracted details
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#71818E]">
                    Verify important fields against the original document.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF0F5] text-xs font-bold text-[#304F6B]">
                  3
                </span>

                <div>
                  <p className="text-sm font-semibold text-[#293D4E]">
                    Check flagged findings
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#71818E]">
                    Automated findings may need human verification.
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-6 rounded-lg border border-[#D5E0E9] bg-[#F3F7FA] p-4">
              <p className="text-xs font-semibold text-[#405F79]">
                Data handling
              </p>

              <p className="mt-2 text-xs leading-5 text-[#657989]">
                Do not upload documents unless you are authorised to
                process them. Follow your organisation&apos;s data-handling
                requirements.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

