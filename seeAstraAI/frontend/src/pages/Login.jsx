import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
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
        throw new Error(
          "Login response did not contain an authentication token."
        );
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
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      {/* Page header */}

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-12">
        {/* Login form */}
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-[0_12px_35px_rgba(32,54,75,0.09)] sm:p-8 lg:mx-0">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#476C8A]">
              Welcome back
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#20364B] sm:text-4xl">
              Sign in to SeeAstra
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#647789]">
              Access your workspace to manage documents and continue your
              reviews.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#293D50]"
              >
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
                className="w-full rounded-lg border border-[#C7D5E1] bg-[#F9FBFD] px-4 py-3 text-sm text-[#29333D] outline-none transition placeholder:text-[#8999A7] focus:border-[#355D7A] focus:bg-white focus:ring-2 focus:ring-[#355D7A]/15"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#293D50]"
              >
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
                  className="w-full rounded-lg border border-[#C7D5E1] bg-[#F9FBFD] px-4 py-3 pr-20 text-sm text-[#29333D] outline-none transition placeholder:text-[#8999A7] focus:border-[#355D7A] focus:bg-white focus:ring-2 focus:ring-[#355D7A]/15"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 rounded px-2 text-xs font-semibold text-[#355D7A] transition hover:bg-[#DCE8F2] hover:text-[#20364B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355D7A]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[#E8C5C5] bg-[#FBECEC] px-4 py-3 text-sm text-[#A52F36]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-[#20364B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#14283B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355D7A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#647789]">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[#20364B] underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>

          <p className="mt-7 border-t border-[#E2EAF0] pt-5 text-center text-xs leading-5 text-[#7A8B99]">
            Use your registered account to access your review workspace.
          </p>
        </div>

        {/* Information panel */}
        <aside className="hidden lg:block">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#A3B9CC] bg-white/55 px-3 py-2 text-xs font-semibold text-[#294C69]">
              <ShieldCheck size={15} />
              Your review workspace
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-snug tracking-tight text-[#20364B] xl:text-4xl">
              Keep documents, findings and reviewer activity organised.
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#40566A]">
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
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/45 p-4"
                >
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-[#397454]"
                  />

                  <p className="text-sm font-medium text-[#293D50]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

