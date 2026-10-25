import { NavLink, Link, useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  LayoutDashboard,
  Files,
  Upload,
  ClipboardCheck,
  History,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", to: "/documents", icon: Files },
  { label: "Upload", to: "/documents/upload", icon: Upload },
  { label: "Reviewer Queue", to: "/reviews/queue", icon: ClipboardCheck },
  { label: "Audit Trail", to: "/audit", icon: History },
];

const navLinkClass = ({ isActive }) =>
  `group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
    isActive
      ? "border-white/20 bg-white text-[#20364B]"
      : "border-transparent text-white/85 hover:border-white/15 hover:bg-white/10 hover:text-white"
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const lastDocumentId = localStorage.getItem("lastDocumentId");

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  function handleAnalysisClick() {
    if (lastDocumentId) {
      navigate(
        `/documents/${encodeURIComponent(lastDocumentId)}/analysis`
      );
    } else {
      navigate("/documents");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#14283B] bg-[#20364B] shadow-[0_4px_14px_rgba(20,40,59,0.18)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white text-[#20364B] shadow-sm transition-transform duration-200 group-hover:scale-[1.04]">
            <ShieldCheck size={22} strokeWidth={1.8} />
          </span>

          <span className="text-lg font-bold tracking-tight text-white">
            SeeAstra <span className="text-[#B7C9D9]">AI</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-1"
        >
          {isLoggedIn &&
            navItems.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  className="shrink-0"
                />
                <span>{label}</span>
              </NavLink>
            ))}

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <LogIn size={16} />
                Login
              </Link>

              <Link
                to="/signup"
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#20364B] shadow-sm transition-colors hover:bg-[#DCE8F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#20364B]"
              >
                <UserPlus size={16} />
                Sign up
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

