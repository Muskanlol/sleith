import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ALL_NAV_ITEMS } from "../../utils/constants";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

function ThemeToggle({ theme, toggle }) {
  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
      style={{
        background: "var(--hover-bg)",
        border: "1px solid var(--card-border)",
        color: "var(--text-secondary)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        /* Sun */
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        /* Moon */
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function Layout() {
  const location          = useLocation();
  const { theme, toggleTheme } = useTheme();

  /* Detect if current section is Academy */
  const isAcademy = location.pathname.includes("/academy");

  /* Page title from nav config */
  const currentItem = ALL_NAV_ITEMS.find((item) => location.pathname === item.path);
  const title = currentItem?.label || "SLEITH Admin";

  /* Accent colour for header accent dot */
  const accentColor = isAcademy ? "#9b5a6e" : "#c9a96e";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Sidebar />

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="ml-56 flex-1 flex flex-col min-h-screen">

        {/* ── Topbar ──────────────────────────────────────────────────── */}
        <header
          className="h-16 flex items-center justify-between px-6 sticky top-0 z-30 flex-shrink-0"
          style={{
            background: theme === "dark"
              ? "rgba(10,10,10,0.85)"
              : "rgba(245,240,232,0.88)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          {/* Left: breadcrumb-style title */}
          <div className="flex items-center gap-2.5">
            {/* Accent dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: accentColor }}
            />
            <h1
              className="text-[17px] font-semibold tracking-tight"
              style={{
                color: "var(--text-primary)",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Right: theme toggle */}
          <div className="flex items-center gap-3">
            {/* Section tag */}
            <span
              className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[0.15em] uppercase"
              style={{
                background: isAcademy ? "rgba(155,90,110,0.12)" : "rgba(201,169,110,0.12)",
                color: accentColor,
                border: `1px solid ${accentColor}30`,
              }}
            >
              {isAcademy ? "Academy" : "Salon"}
            </span>

            <ThemeToggle theme={theme} toggle={toggleTheme} />
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────────────── */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
