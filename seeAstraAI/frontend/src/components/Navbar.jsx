
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Files,
  Upload,
  ClipboardCheck,
  History,
  FileSearch,
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
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-[#E8F0E8] text-[#245642]"
      : "text-[#52645A] hover:bg-[#F0F4EF] hover:text-[#20392D]"
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
    <header className="sticky top-0 z-50 border-b border-[#DFE6DE] bg-[#FAFBF9]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#245642] text-white">
            <ShieldCheck size={23} />
          </span>

          <span className="text-lg font-bold tracking-tight text-[#20392D]">
            SeeAstra <span className="text-[#39805E]">AI</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {isLoggedIn && (
            <>
              {navItems.slice(0, 3).map(({ label, to, icon: Icon }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}

              

              {navItems.slice(3).map(({ label, to, icon: Icon }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#245642] hover:bg-[#F0F4EF]"
              >
                <LogIn size={16} />
                Login
              </Link>

              <Link
                to="/signup"
                className="flex items-center gap-2 rounded-lg bg-[#245642] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1B4432]"
              >
                <UserPlus size={16} />
                Sign up
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-[#DFE6DE] px-3 py-2 text-sm font-medium text-[#52645A] hover:bg-[#F0F4EF]"
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
