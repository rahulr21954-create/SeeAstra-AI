
import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    title: "Document extraction",
    description:
      "Extract relevant text and application details from uploaded PDF documents, including scanned files where OCR is required.",
  },
  {
    number: "02",
    title: "Requirement checks",
    description:
      "Identify missing information and check whether important application fields are present.",
  },
  {
    number: "03",
    title: "Cross-document review",
    description:
      "Compare details across documents and flag possible inconsistencies for closer examination.",
  },
  {
    number: "04",
    title: "Reviewer decisions",
    description:
      "Keep findings, reviewer remarks and review activity organised in one traceable workflow.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload documents",
    description:
      "Submit the application PDFs and supporting documents for review.",
  },
  {
    number: "02",
    title: "Run automated checks",
    description:
      "The system extracts information and checks for missing fields or inconsistencies.",
  },
  {
    number: "03",
    title: "Review the findings",
    description:
      "Examine flagged issues, verify the source documents and record decisions.",
  },
];

function SectionLabel({ children }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#355D7A]">
      {children}
    </p>
  );
}

function DocumentRow({ title, subtitle, status, statusClass }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#D8E1E9] bg-white p-3.5 transition-colors duration-200 hover:border-[#91AFC8]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#E8EEF5] text-[11px] font-bold text-[#20364B]">
        PDF
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#29333D]">
          {title}
        </p>
        <p className="mt-1 text-xs text-[#667789]">{subtitle}</p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}
      >
        {status}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#91A9BF] bg-[#D2DEE8] px-3.5 py-2 text-xs font-semibold text-[#20364B]">
            <span className="h-2 w-2 rounded-full bg-[#355D7A]" />
            AI-assisted institutional review
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.14] tracking-[-0.035em] text-[#20364B] sm:text-5xl lg:text-[58px]">
            A clearer way to review complex documents.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-[#3F5367] sm:text-lg">
            SeeAstra AI helps organise application documents, extract
            relevant information and identify potential issues before
            a reviewer makes a decision.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-3 rounded-md bg-[#20364B] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#14283B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355D7A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#B7C9D9]"
            >
              Start a review
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#workflow"
              className="rounded-md border border-[#8FA6BA] bg-[#F8FAFC] px-5 py-3.5 text-sm font-semibold text-[#20364B] transition-colors hover:border-[#6F8DA8] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355D7A] focus-visible:ring-offset-2"
            >
              Explore the workflow
            </a>
          </div>

          <div className="mt-10 border-t border-[#91A8BD] pt-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DDEBE0] text-xs font-bold text-[#326447]">
                ✓
              </span>
              <p className="max-w-lg text-sm leading-6 text-[#40566A]">
                Designed to support human review, not replace reviewer
                judgement or make final approval decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Illustrative review workspace */}
        <div className="mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-xl border border-[#D5DFE8] bg-white shadow-[0_12px_36px_rgba(32,54,75,0.13)]">
            <div className="flex items-center justify-between border-b border-[#E2E8EE] px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm font-bold text-[#20364B]">
                  Review workspace
                </p>
                <p className="mt-1 text-xs text-[#667789]">
                  Illustrative interface
                </p>
              </div>

              <span className="rounded-full border border-[#E4D3A9] bg-[#FBF3DF] px-3 py-1 text-xs font-semibold text-[#805D20]">
                In review
              </span>
            </div>

            <div className="bg-[#F5F8FB] p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#708195]">
                  Application
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#20364B]">
                  Institutional application
                </h2>
                <p className="mt-1 text-sm text-[#667789]">
                  Supporting documents and extracted details
                </p>
              </div>

              <div className="space-y-3">
                <DocumentRow
                  title="Application form"
                  subtitle="Text extraction"
                  status="Ready"
                  statusClass="bg-[#E5F1E8] text-[#326447]"
                />

                <DocumentRow
                  title="Supporting certificate"
                  subtitle="Field comparison"
                  status="Check"
                  statusClass="bg-[#FBF1DC] text-[#805D20]"
                />

                <DocumentRow
                  title="Institutional records"
                  subtitle="Information matching"
                  status="Pending"
                  statusClass="bg-[#E9EDF1] text-[#536476]"
                />
              </div>

              <div className="mt-5 rounded-lg border border-[#E6D6B5] bg-[#FBF6E9] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E6D6B5] bg-white text-sm font-bold text-[#8A6729]">
                    !
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-[#725522]">
                      Finding requires attention
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#817255]">
                      A detail may need verification against the source
                      document before the review is completed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E0E7ED] pt-4">
                <span className="text-xs text-[#708195]">
                  Sample content only
                </span>
                <span className="text-xs font-semibold text-[#355D7A]">
                  Reviewer remains in control
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-[#40566A]">
            Concept preview — not live application data.
          </p>
        </div>
      </section>

      {/* Working principles */}
      <section
        id="principles"
        className="border-y border-[#91A8BD] bg-[#D2DEE8]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:px-8 md:grid-cols-3 md:gap-10">
          <div>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#C6D5E2] bg-white text-sm font-semibold text-[#355D7A]">
              01
            </div>
            <p className="text-sm font-bold text-[#20364B]">
              Structured information
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#4C6073]">
              Bring important details together in one review workspace.
            </p>
          </div>

          <div>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#C6D5E2] bg-white text-sm font-semibold text-[#355D7A]">
              02
            </div>
            <p className="text-sm font-bold text-[#20364B]">
              Explainable findings
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#4C6073]">
              Highlight potential issues for human verification.
            </p>
          </div>

          <div>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#C6D5E2] bg-white text-sm font-semibold text-[#355D7A]">
              03
            </div>
            <p className="text-sm font-bold text-[#20364B]">
              Human-led decisions
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#4C6073]">
              Keep final decisions and accountability with authorised reviewers.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="max-w-2xl">
          <SectionLabel>Platform capabilities</SectionLabel>

          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#20364B] sm:text-4xl">
            Less time organising documents.
            <span className="block">More time reviewing details.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-[#3F5367]">
            A focused set of tools to help reviewers find relevant
            information and direct attention to areas that may need
            further examination.
          </p>
        </div>

        <div className="mt-12 grid gap-x-10 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="flex gap-5 border-t border-[#91A8BD] py-7"
            >
              <span className="pt-1 text-sm font-semibold text-[#355D7A]">
                {feature.number}
              </span>

              <div>
                <h3 className="text-lg font-semibold text-[#20364B]">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-7 text-[#4C6073]">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="border-y border-[#91A8BD] bg-[#D2DEE8]"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>How it works</SectionLabel>

            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#20364B] sm:text-4xl">
              A straightforward review process.
            </h2>

            <p className="mt-4 text-base leading-7 text-[#4C6073]">
              From document submission to a recorded reviewer decision,
              each stage has a clear purpose.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-7">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border-t-2 border-[#6F8DA8] pt-5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#355D7A]">
                  Step {step.number}
                </p>

                <h3 className="mt-4 text-lg font-semibold text-[#20364B]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#4C6073]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col justify-between gap-8 border-b border-[#91A8BD] pb-12 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <SectionLabel>Get started</SectionLabel>

            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#20364B] sm:text-4xl">
              Bring your review workflow into one place.
            </h2>

            <p className="mt-4 text-base leading-7 text-[#3F5367]">
              Upload documents, inspect findings and support a more
              organised review process with SeeAstra AI.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-md bg-[#20364B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14283B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355D7A] focus-visible:ring-offset-2"
            >
              Create an account →
            </Link>

            <Link
              to="/login"
              className="rounded-md border border-[#8FA6BA] bg-white px-5 py-3 text-sm font-semibold text-[#20364B] transition-colors hover:bg-[#EAF0F5]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer — no top navigation header */}
      <footer className="border-t border-[#91A8BD] bg-[#A7BCCF]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold text-[#20364B]">SeeAstra AI</p>
            <p className="mt-1 text-xs text-[#40566A]">
              AI-assisted document review and workflow support.
            </p>
          </div>

          <p className="max-w-lg text-xs leading-6 text-[#40566A] md:text-right">
            AI supports the review process. Authorised reviewers make
            final decisions.
          </p>
        </div>
      </footer>
    </main>
  );
}
