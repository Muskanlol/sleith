import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/dashboard.api";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/constants";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

const GOLD   = "#c9a96e";
const CHERRY = "#9b5a6e";

const SALON_CARDS = [
  { key: "total_customers",     label: "Customers",            path: "/admin/customers",    icon: "👥" },
  { key: "total_staff",         label: "Staff",                path: "/admin/staff",         icon: "✂️" },
  { key: "total_services",      label: "Active Services",      path: "/admin/services",      icon: "💆" },
  { key: "total_appointments",  label: "Appointments",         path: "/admin/appointments",  icon: "📅" },
  { key: "total_packages_sold", label: "Packages Sold",        path: "/admin/packages",      icon: "📦" },
  { key: "today_appointments",  label: "Today's Appointments", path: "/admin/appointments",  icon: "🗓️" },
  { key: "pending_appointments",label: "Pending",              path: "/admin/appointments",  icon: "⏳", highlight: true },
];

const REVENUE_CARD = {
  key: "total_revenue",
  label: "Revenue",
  path: "/admin/reports/revenue",
  icon: "₹",
  prefix: "₹",
  special: "revenue",
};

const ACADEMY_CARDS = [
  { key: "total_courses",          label: "Courses",              path: "/admin/academy/courses",      icon: "📚" },
  { key: "total_batches",          label: "Batches",              path: "/admin/academy/batches",      icon: "🗂️" },
  { key: "total_students",         label: "Students",             path: "/admin/academy/students",     icon: "🎓" },
  { key: "pending_applications",   label: "Pending Applications", path: "/admin/academy/applications", icon: "📋", highlight: true },
];

function KpiCard({ card, value, accent = GOLD }) {
  const display = card.prefix
    ? `${card.prefix}${Number(value).toLocaleString("en-IN")}`
    : String(value ?? 0);

  const isHighlight  = card.highlight;
  const isRevenue    = card.special === "revenue";

  return (
    <Link
      to={card.path}
      className="group block rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: isRevenue
          ? `linear-gradient(135deg,${accent}20,${accent}08)`
          : isHighlight
            ? `${accent}18`
            : "var(--card-bg)",
        border: `1px solid ${isHighlight || isRevenue ? `${accent}35` : "var(--card-border)"}`,
        boxShadow: isHighlight || isRevenue ? `0 0 24px ${accent}14` : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xl leading-none">{card.icon}</span>
        <svg
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: accent }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p
        className="text-sm font-medium mb-1"
        style={{ color: isHighlight || isRevenue ? accent : "var(--text-secondary)" }}
      >
        {card.label}
      </p>
      <p
        className="text-3xl font-bold tracking-tight transition-colors"
        style={{ color: isHighlight || isRevenue ? accent : "var(--text-primary)" }}
      >
        {display}
      </p>
    </Link>
  );
}

function SectionHeader({ label, accent, description }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: accent }}
          >
            {label}
          </span>
          <div className="h-px w-12" style={{ background: `${accent}35` }} />
        </div>
        {description && (
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const isAdmin  = user?.role === ROLES.ADMIN;

  const [stats,        setStats]       = useState(null);
  const [academyStats, setAcademyStats] = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data }, academyRes] = await Promise.all([
        dashboardApi.getStats(),
        api.get("/admin/academy/dashboard/").catch(() => null),
      ]);
      setStats(data);
      setAcademyStats(academyRes?.data || null);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <div>
      <PageHeader title="Dashboard" description="Operational overview" />
      <LoadingState message="Loading dashboard…" />
    </div>
  );

  if (error) return (
    <div>
      <PageHeader title="Dashboard" description="Operational overview" />
      <ErrorState message={error} onRetry={fetchStats} />
    </div>
  );

  const salonCards = isAdmin ? [...SALON_CARDS, REVENUE_CARD] : SALON_CARDS;

  return (
    <div className="space-y-10">

      {/* ── Salon overview ──────────────────────────────────────────── */}
      <section>
        <SectionHeader
          label="Salon"
          accent={GOLD}
          description="Live snapshot of salon operations"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {salonCards.map((card) => (
            <KpiCard key={card.key} card={card} value={stats?.[card.key] ?? 0} accent={GOLD} />
          ))}
        </div>
      </section>

      {/* ── Academy overview ────────────────────────────────────────── */}
      {academyStats && (
        <section>
          <SectionHeader
            label="Academy"
            accent={CHERRY}
            description="Education & training operations"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACADEMY_CARDS.map((card) => (
              <KpiCard key={card.key} card={card} value={academyStats?.[card.key] ?? 0} accent={CHERRY} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
