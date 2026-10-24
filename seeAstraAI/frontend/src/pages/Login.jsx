
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);
      const data = response.data?.data || response.data;
      const token = data.token || data.accessToken;

      if (!token) {
        throw new Error("Login response did not contain an authentication token.");
      }

      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to sign in. Please try again."
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
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#20392D] sm:text-4xl">
            Sign in to SeeAstra
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#718077]">
            Access your workspace to manage documents and continue your reviews.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-[#D6DED7] bg-white px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-[#A0AAA2] focus:border-[#39735D] focus:ring-2 focus:ring-[#39735D]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 text-xs font-medium text-[#547263] hover:text-[#245642]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-[#E8CFCB] bg-[#FBF2F0] px-4 py-3 text-sm text-[#994A40]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#245642] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1B4635] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#718077]">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-[#2D674C] hover:underline">
              Create an account
            </Link>
          </p>

          <p className="mt-10 text-center text-xs leading-5 text-[#89948B]">
            Use your registered account to access your review workspace.
          </p>
        </div>

        <aside className="hidden border-l border-[#DFE6DE] pl-12 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#39735D]">
            Your review workspace
          </p>
          <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-snug tracking-tight text-[#20392D]">
            Keep documents, findings and reviewer activity organised.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#718077]">
            SeeAstra helps bring extracted information and potential
            document issues into a structured workflow, so reviewers can
            focus on verification and informed decisions.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Centralised document workspace",
              "Structured findings for verification",
              "Review activity and decision tracking",
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
