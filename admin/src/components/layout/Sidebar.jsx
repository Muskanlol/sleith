import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { NAV_ITEMS, ACADEMY_NAV_ITEMS } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";

/* ── Icon primitives ───────────────────────────────────────────────────── */
function IconHome() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconScissors() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" strokeWidth={1.8} />
      <circle cx="6" cy="18" r="3" strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconChevron({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

/* ── Avatar initials ───────────────────────────────────────────────────── */
function Avatar({ name = "" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-[#0a0a0a] flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#c9a96e,#a07842)" }}
    >
      {initials}
    </div>
  );
}

/* ── Section heading with accent bar ───────────────────────────────────── */
function SectionLabel({ label, color }) {
  return (
    <div className="flex items-center gap-2 px-3 mb-1 mt-5 first:mt-2">
      <span
        className="text-[9px] font-bold tracking-[0.2em] uppercase"
        style={{ color }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: `${color}30` }} />
    </div>
  );
}

/* ── Single nav link ────────────────────────────────────────────────────── */
function SidebarLink({ to, label, accentColor }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          isActive ? "font-semibold" : "text-white/45 hover:text-white/80"
        }`
      }
      style={({ isActive }) =>
        isActive
          ? {
              color: accentColor,
              background: `${accentColor}14`,
              borderLeft: `2px solid ${accentColor}`,
              paddingLeft: "10px",
            }
          : {}
      }
    >
      {label}
    </NavLink>
  );
}

/* ── Collapsible section ────────────────────────────────────────────────── */
function CollapsibleSection({ label, icon, accentColor, items, isActive, open, onToggle }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150"
        style={
          isActive
            ? {
                color: accentColor,
                background: `${accentColor}12`,
              }
            : { color: "rgba(255,255,255,0.55)" }
        }
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.85)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.55)";
        }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: isActive ? accentColor : "rgba(255,255,255,0.4)" }}>{icon}</span>
          <span>{label}</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>
          <IconChevron open={open || isActive} />
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open || isActive ? "600px" : "0", opacity: open || isActive ? 1 : 0 }}
      >
        <div className="ml-3 mt-0.5 mb-1 pl-3 space-y-0.5" style={{ borderLeft: `1px solid ${accentColor}25` }}>
          {items.map((item) => (
            <SidebarLink key={item.path} to={item.path} label={item.label} accentColor={accentColor} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Sidebar ───────────────────────────────────────────────────────── */
function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [academyOpen, setAcademyOpen] = useState(false);
  const [salonOpen, setSalonOpen]     = useState(false);

  const visibleItems   = NAV_ITEMS.filter((i) => i.roles.includes(user?.role));
  const visibleAcademy = ACADEMY_NAV_ITEMS.filter((i) => i.roles.includes(user?.role));
  const visibleSalon   = visibleItems.filter((i) => i.group === "salon");
  const visibleReports = visibleItems.filter((i) => i.group === "reports");
  const topItems       = visibleItems.filter((i) => !i.group);

  const isSalonActive   = visibleSalon.some((i) => location.pathname.startsWith(i.path));
  const isAcademyActive = visibleAcademy.some((i) => location.pathname.startsWith(i.path));

  const GOLD   = "#c9a96e";
  const CHERRY = "#9b5a6e";

  return (
    <aside
      className="w-56 h-screen flex flex-col fixed left-0 top-0 z-40"
      style={{
        background: "linear-gradient(180deg, #0e0b07 0%, #0d0a06 100%)",
        borderRight: "1px solid rgba(201,169,110,0.1)",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        className="h-16 flex items-center px-5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(201,169,110,0.08)" }}
      >
        <div>
          <span
            className="text-xl font-bold tracking-[0.18em] uppercase"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              background: "linear-gradient(135deg,#c9a96e,#dbb87a,#c9a96e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SLEITH
          </span>
          <p className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
            Admin Portal
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">

        {/* Top-level items (Dashboard, Users, Gallery) */}
        {topItems.length > 0 && (
          <>
            <SectionLabel label="Overview" color={GOLD} />
            {topItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive ? "font-semibold" : "text-white/45 hover:text-white/80 hover:bg-white/4"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { color: GOLD, background: `${GOLD}14` }
                    : {}
                }
              >
                {item.label === "Dashboard" && <IconHome />}
                {item.label === "Users" && <IconUsers />}
                {item.label === "Gallery" && (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}

        {/* ── Salon section ─────────────────────────────────────────── */}
        {visibleSalon.length > 0 && (
          <>
            <SectionLabel label="Salon" color={GOLD} />
            <CollapsibleSection
              label="Salon"
              icon={<IconScissors />}
              accentColor={GOLD}
              items={visibleSalon}
              isActive={isSalonActive}
              open={salonOpen}
              onToggle={() => setSalonOpen((o) => !o)}
            />
          </>
        )}

        {/* ── Academy section ───────────────────────────────────────── */}
        {visibleAcademy.length > 0 && (
          <>
            <SectionLabel label="Academy" color={CHERRY} />
            <CollapsibleSection
              label="Academy"
              icon={<IconBook />}
              accentColor={CHERRY}
              items={visibleAcademy}
              isActive={isAcademyActive}
              open={academyOpen}
              onToggle={() => setAcademyOpen((o) => !o)}
            />
          </>
        )}

        {/* ── Reports ───────────────────────────────────────────────── */}
        {visibleReports.length > 0 && (
          <>
            <SectionLabel label="Reports" color={GOLD} />
            {visibleReports.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive ? "font-semibold" : "text-white/45 hover:text-white/80"
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { color: GOLD, background: `${GOLD}14` } : {}
                }
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* ── Footer / User ────────────────────────────────────────────── */}
      <div
        className="p-4 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(201,169,110,0.08)" }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar name={user?.full_name} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {user?.full_name || "User"}
            </p>
            <p
              className="text-[10px] tracking-[0.15em] uppercase truncate mt-0.5"
              style={{ color: "rgba(201,169,110,0.6)" }}
            >
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
          style={{ color: "rgba(255,100,80,0.7)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f87171";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,100,80,0.7)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <IconLogout />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
