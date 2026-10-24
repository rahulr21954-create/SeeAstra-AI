
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess("Your account has been created. You can now sign in.");
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFBF9] text-[#24372F]">
      <header className="border-b border-[#E3E8E2]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#245642] text-lg font-semibold text-white">
              S
            </div>
            <div>
              <p className="text-lg font-semibold text-[#20392D]">SeeAstra</p>
              <p className="text-[11px] tracking-wide text-[#718077]">
                DOCUMENT REVIEW PLATFORM
              </p>
            </div>
          </Link>
          <Link to="/" className="text-sm text-[#64746A] hover:text-[#245642]">
            Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#39735D]">
            Get started
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#20392D] sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#718077]">
            Set up your account to access the SeeAstra document review workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#35483C]">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-md border border-[#D6DED7] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#A0AAA2] focus:border-[#39735D] focus:ring-2 focus:ring-[#39735D]/10"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#35483C]">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-md border border-[#D6DED7] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#A0AAA2] focus:border-[#39735D] focus:ring-2 focus:ring-[#39735D]/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#35483C]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                className="w-full rounded-md border border-[#D6DED7] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#A0AAA2] focus:border-[#39735D] focus:ring-2 focus:ring-[#39735D]/10"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#35483C]">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Enter your password again"
                className="w-full rounded-md border border-[#D6DED7] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#A0AAA2] focus:border-[#39735D] focus:ring-2 focus:ring-[#39735D]/10"
              />
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[#718077]">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="accent-[#245642]"
                />
                Show passwords
              </label>
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-[#E8CFCB] bg-[#FBF2F0] px-4 py-3 text-sm text-[#994A40]">
                {error}
              </p>
            )}

            {success && (
              <div role="status" className="rounded-md border border-[#D5E5D8] bg-[#F0F7F0] px-4 py-3">
                <p className="text-sm text-[#326344]">{success}</p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-2 text-sm font-semibold text-[#245642] hover:underline"
                >
                  Continue to sign in →
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#245642] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1B4635] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#718077]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#2D674C] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <aside className="hidden border-l border-[#DFE6DE] pl-12 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#39735D]">
            Built for structured review
          </p>
          <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-snug tracking-tight text-[#20392D]">
            Make document review easier to organise and follow.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#718077]">
            SeeAstra brings document extraction, requirement checks and
            potential inconsistencies into one workflow for authorised reviewers.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Upload and organise application documents",
              "Identify details that may need verification",
              "Record findings and reviewer decisions",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E6EFE7] text-xs text-[#397052]">
                  ✓
                </span>
                <p className="text-sm text-[#52665A]">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
