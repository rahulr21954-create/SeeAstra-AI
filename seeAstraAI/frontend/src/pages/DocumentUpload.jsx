
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

    if (selectedFile.type !== "application/pdf" &&
        !selectedFile.name.toLowerCase().endsWith(".pdf")) {
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
            setProgress(Math.round((event.loaded * 100) / event.total));
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
      if (err.response?.status === 401 || err.response?.status === 403) {
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
    <main className="min-h-screen bg-[#FAFBF9] text-[#24372F]">

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#39735D]">
            Document management
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20392D] sm:text-4xl">
            Upload a document
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#718077] sm:text-base">
            Add an application document or supporting PDF to begin
            extraction and review.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
          <form
            onSubmit={handleUpload}
            className="border border-[#DFE6DE] bg-white p-5 sm:p-8"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#2B4435]">
                Select your PDF
              </h2>
              <p className="mt-1 text-sm text-[#849087]">
                Upload one document at a time.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />

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
              className={`rounded-md border border-dashed p-7 text-center transition sm:p-10 ${
                dragging
                  ? "border-[#39735D] bg-[#F0F6F0]"
                  : "border-[#CBD8CC] bg-[#FAFBF9]"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-[#DDE6DC] bg-white text-sm font-semibold text-[#477658]">
                PDF
              </div>

              <p className="mt-5 text-sm font-semibold text-[#35483C]">
                Drag and drop your PDF here
              </p>
              <p className="mt-2 text-sm text-[#849087]">
                or select a file from your device
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 rounded-md border border-[#C8D6CA] bg-white px-4 py-2.5 text-sm font-medium text-[#365543] transition hover:bg-[#F1F5F0]"
              >
                Browse files
              </button>

              <p className="mt-4 text-xs text-[#89948B]">
                PDF only · Maximum size 10 MB
              </p>
            </div>

            {file && (
              <div className="mt-5 flex items-center gap-3 border border-[#DDE6DC] bg-[#F7F9F6] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#E6EFE7] text-xs font-semibold text-[#397052]">
                  PDF
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#35483C]">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-[#849087]">
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
                  className="text-sm text-[#7B665D] hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}

            {uploading && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-[#718077]">
                  <span>Uploading document</span>
                  <span>{progress}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-[#E6ECE5]"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-[#39735D] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-md border border-[#E8CFCB] bg-[#FBF2F0] px-4 py-3 text-sm text-[#994A40]"
              >
                {error}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#E6EBE4] pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/dashboard"
                className="rounded-md border border-[#D6DED7] px-5 py-3 text-center text-sm font-medium text-[#58675E] hover:bg-[#F5F7F3]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!file || uploading}
                className="rounded-md bg-[#245642] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1B4635] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload document"}
              </button>
            </div>
          </form>

          <aside className="border border-[#DFE6DE] bg-white p-5">
            <h2 className="text-base font-semibold text-[#2B4435]">
              Before you upload
            </h2>

            <ul className="mt-5 space-y-5">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#F0F4EF] text-xs font-semibold text-[#547263]">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-[#35483C]">
                    Check the file
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#849087]">
                    Ensure the file is a valid PDF and is within the size limit.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#F0F4EF] text-xs font-semibold text-[#547263]">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-[#35483C]">
                    Review the extracted details
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#849087]">
                    Verify important fields against the original document.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#F0F4EF] text-xs font-semibold text-[#547263]">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-[#35483C]">
                    Check flagged findings
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#849087]">
                    Automated findings may need human verification.
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-6 border-t border-[#E6EBE4] pt-5">
              <p className="text-xs leading-5 text-[#849087]">
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
