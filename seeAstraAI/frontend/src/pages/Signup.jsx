import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
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
    <main className="min-h-screen bg-[#B7C9D9] text-[#29333D]">
      {/* Page header */}
      

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-12">
        {/* Signup form */}
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-[0_12px_35px_rgba(32,54,75,0.09)] sm:p-8 lg:mx-0">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#476C8A]">
              Get started
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#20364B] sm:text-4xl">
              Create your account
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#647789]">
              Set up your account to access the SeeAstra document review
              workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-[#293D50]"
              >
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
                className="w-full rounded-lg border border-[#C7D5E1] bg-[#F9FBFD] px-4 py-3 text-sm text-[#29333D] outline-none transition placeholder:text-[#8999A7] focus:border-[#355D7A] focus:bg-white focus:ring-2 focus:ring-[#355D7A]/15"
              />
            </div>

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
                className="w-full rounded-lg border border-[#C7D5E1] bg-[#F9FBFD] px-4 py-3 text-sm text-[#29333D] outline-none transition placeholder:text-[#8999A7] focus:border-[#355D7A] focus:bg-white focus:ring-2 focus:ring-[#355D7A]/15"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-[#293D50]"
              >
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
                className="w-full rounded-lg border border-[#C7D5E1] bg-[#F9FBFD] px-4 py-3 text-sm text-[#29333D] outline-none transition placeholder:text-[#8999A7] focus:border-[#355D7A] focus:bg-white focus:ring-2 focus:ring-[#355D7A]/15"
              />

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[#647789]">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 accent-[#20364B]"
                />
                Show passwords
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[#E8C5C5] bg-[#FBECEC] px-4 py-3 text-sm text-[#A52F36]"
              >
                {error}
              </p>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-[#BBD9C5] bg-[#EAF5ED] px-4 py-3"
              >
                <p className="text-sm text-[#28734D]">{success}</p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-2 text-sm font-semibold text-[#28734D] hover:underline"
                >
                  Continue to sign in →
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#20364B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#14283B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355D7A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#647789]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#20364B] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Information panel */}
        <aside className="hidden lg:block">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#A3B9CC] bg-white/55 px-3 py-2 text-xs font-semibold text-[#294C69]">
              <ShieldCheck size={15} />
              Built for structured review
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-snug tracking-tight text-[#20364B] xl:text-4xl">
              Make document review easier to organise and follow.
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#40566A]">
              SeeAstra brings document extraction, requirement checks and
              potential inconsistencies into one workflow for authorised
              reviewers.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Upload and organise application documents",
                "Identify details that may need verification",
                "Record findings and reviewer decisions",
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

