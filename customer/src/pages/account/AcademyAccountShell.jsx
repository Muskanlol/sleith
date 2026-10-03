import { Link, NavLink } from 'react-router-dom'

const NAV = [
  { to: '/account/academy',             label: 'Enrollments',  end: true },
  { to: '/account/academy/attendance',  label: 'Attendance' },
  { to: '/account/academy/results',     label: 'Results' },
  { to: '/account/academy/practicals',  label: 'Practicals' },
  { to: '/account/academy/certificates',label: 'Certificates' },
  { to: '/account/academy-fees',        label: 'Fees' },
  { to: '/account/applications',        label: 'Applications' },
]

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtTime(t) {
  if (!t) return ''
  const [h, m] = String(t).split(':')
  const hour = Number(h)
  if (Number.isNaN(hour)) return String(t).slice(0, 5)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const h12 = hour % 12 || 12
  return `${h12}:${m || '00'} ${ampm}`
}

export function StatusPill({ label, tone = 'muted' }) {
  const tones = {
    green:  { bg: 'rgba(34,197,94,0.10)',  text: '#16a34a', border: 'rgba(34,197,94,0.3)' },
    red:    { bg: 'rgba(239,68,68,0.10)',  text: '#dc2626', border: 'rgba(239,68,68,0.3)' },
    gold:   { bg: 'rgba(201,169,110,0.12)', text: '#c9a96e', border: 'rgba(201,169,110,0.3)' },
    cherry: { bg: 'rgba(155,90,110,0.15)', text: '#c97b90', border: 'rgba(155,90,110,0.4)' },
    muted:  { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.12)' },
  }
  const s = tones[tone] || tones.muted
  return (
    <span
      className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-[0.12em] uppercase border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {label}
    </span>
  )
}

export function AcademySubNav() {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-2">
      {NAV.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-full text-[11px] tracking-widest uppercase border transition-all ${
              isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`
          }
          style={({ isActive }) => ({
            borderColor: isActive ? 'rgba(201,169,110,0.45)' : 'rgba(255,255,255,0.1)',
            background: isActive ? 'rgba(201,169,110,0.12)' : 'transparent',
            color: isActive ? '#c9a96e' : undefined,
          })}
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}

export default function AcademyAccountShell({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #120a0d 60%, #0d0a11 100%)' }}
    >
      <div className="pt-28 pb-8 px-4 text-center">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: '#c97b90' }}>
          My Academy
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">{title}</h1>
        {subtitle && <p className="text-white/40 text-sm">{subtitle}</p>}

        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <Link
            to="/account"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase border transition-all hover:border-white/30"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            ← My Profile
          </Link>
          <Link
            to="/academy"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase font-semibold"
            style={{ background: 'linear-gradient(135deg,#9b5a6e,#c9a96e)', color: '#fff' }}
          >
            Browse Courses →
          </Link>
        </div>

        <AcademySubNav />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">{children}</div>
    </div>
  )
}
