
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
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#39735D]">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFBF9] text-[#24372F]">
      {/* Navigation */}
      <header className="border-b border-[#E3E8E2] bg-[#FAFBF9]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#245642] text-lg font-semibold text-white">
              S
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-[#20392D]">
                SeeAstra
              </p>
              <p className="text-[11px] tracking-wide text-[#718077]">
                DOCUMENT REVIEW PLATFORM
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[#58675E] md:flex">
            <a href="#features" className="transition hover:text-[#245642]">
              Capabilities
            </a>
            <a href="#workflow" className="transition hover:text-[#245642]">
              How it works
            </a>
            <a href="#principles" className="transition hover:text-[#245642]">
              Our approach
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden px-3 py-2 text-sm font-medium text-[#365447] transition hover:text-[#183D2D] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-[#245642] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1B4635]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <SectionLabel>AI-assisted institutional review</SectionLabel>

          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.13] tracking-tight text-[#20392D] sm:text-5xl lg:text-[58px]">
            A clearer way to review complex documents.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-[#65736A] sm:text-lg sm:leading-8">
            SeeAstra AI helps organise application documents, extract
            relevant information and identify potential issues before
            a reviewer makes a decision.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-3 rounded-md bg-[#245642] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1B4635]"
            >
              Start a review
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#workflow"
              className="rounded-md border border-[#D6DED7] px-5 py-3 text-sm font-medium text-[#385448] transition hover:bg-[#F0F4F0]"
            >
              Explore the workflow
            </a>
          </div>

          <div className="mt-10 border-t border-[#E0E6DF] pt-5">
            <p className="max-w-lg text-sm leading-6 text-[#718077]">
              Designed to support human review, not replace reviewer
              judgement or make final approval decisions.
            </p>
          </div>
        </div>

        {/* Illustrative workflow preview */}
        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-[#DDE5DC] bg-white shadow-[0_12px_35px_rgba(32,57,45,0.06)]">
            <div className="flex items-center justify-between border-b border-[#E5EAE4] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[#2A4134]">
                  Review workspace
                </p>
                <p className="mt-1 text-xs text-[#849087]">
                  Illustrative interface
                </p>
              </div>
              <span className="rounded border border-[#DCE8DE] bg-[#F2F7F2] px-2.5 py-1 text-xs font-medium text-[#397052]">
                In review
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[#849087]">
                  Application
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#2A4134]">
                  Institutional application
                </h2>
                <p className="mt-1 text-sm text-[#78857B]">
                  Supporting documents and extracted details
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-md border border-[#E4E9E2] p-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#F0F4EF] text-sm font-semibold text-[#41644F]">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#35483C]">
                      Application form
                    </p>
                    <p className="mt-1 text-xs text-[#849087]">
                      Text extraction
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#477658]">
                    Ready
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-md border border-[#E4E9E2] p-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#F0F4EF] text-sm font-semibold text-[#41644F]">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#35483C]">
                      Supporting certificate
                    </p>
                    <p className="mt-1 text-xs text-[#849087]">
                      Field comparison
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#9A6B2F]">
                    Check
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-[#E8DCC7] bg-[#FBF8F1] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D9C6A7] text-xs font-semibold text-[#926B37]">
                    !
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#72562F]">
                      Finding requires attention
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#81735D]">
                      A detail may need verification against the source
                      document before the review is completed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#E7EBE5] pt-4">
                <span className="text-xs text-[#849087]">
                  Reviewer remains in control
                </span>
                <span className="text-xs font-medium text-[#3F6650]">
                  View findings →
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#8A958C]">
            Concept preview — sample content, not live application data.
          </p>
        </div>
      </section>

      {/* Working principles */}
      <section id="principles" className="border-y border-[#E2E8E0] bg-[#F1F5F0]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-3 md:gap-10">
          <div>
            <p className="text-sm font-semibold text-[#2D4A39]">
              Structured information
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#718077]">
              Bring important details together in one review workspace.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2D4A39]">
              Explainable findings
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#718077]">
              Highlight potential issues for human verification.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2D4A39]">
              Human-led decisions
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#718077]">
              Keep final decisions and accountability with authorised reviewers.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <SectionLabel>Platform capabilities</SectionLabel>
          <h2 className="text-3xl font-semibold tracking-tight text-[#20392D] sm:text-4xl">
            Less time organising documents.
            <br className="hidden sm:block" /> More time reviewing details.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#718077]">
            A focused set of tools to help reviewers find relevant
            information and direct attention to areas that may need
            further examination.
          </p>
        </div>

        <div className="mt-12 grid gap-x-12 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="flex gap-5 border-t border-[#DFE6DE] py-7"
            >
              <span className="pt-1 text-sm font-medium text-[#6C8A76]">
                {feature.number}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[#2B4435]">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#718077]">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-[#E2E8E0] bg-[#F5F7F3]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-[#20392D] sm:text-4xl">
              A straightforward review process.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#718077]">
              From document submission to a recorded reviewer decision,
              each stage has a clear purpose.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <article key={step.number} className="border-t-2 border-[#A8BEAC] pt-5">
                <p className="text-sm font-semibold tracking-wide text-[#62806B]">
                  STEP {step.number}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-[#2B4435]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#718077]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col justify-between gap-8 border-b border-[#DFE6DE] pb-12 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <SectionLabel>Get started</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-[#20392D] sm:text-4xl">
              Bring your review workflow into one place.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#718077]">
              Upload documents, inspect findings and support a more
              organised review process with SeeAstra AI.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-md bg-[#245642] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1B4635]"
            >
              Create an account →
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-[#D6DED7] px-5 py-3 text-sm font-medium text-[#385448] transition hover:bg-[#F0F4F0]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E3E8E2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-sm text-[#7B887F] sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[#345341]">SeeAstra AI</p>
            <p className="mt-1 text-xs">
              AI-assisted document review and workflow support.
            </p>
          </div>
          <p className="text-xs">
            AI supports the review process. Authorised reviewers make decisions.
          </p>
        </div>
      </footer>
    </main>
  );
}
