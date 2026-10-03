import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingApi } from '../../api/booking.api'

const PKG_STATUS = {
  ACTIVE:    { label: 'Active',      bg: 'rgba(34,197,94,0.10)',   text: '#16a34a', border: 'rgba(34,197,94,0.3)'  },
  EXPIRED:   { label: 'Expired',     bg: 'rgba(239,68,68,0.10)',   text: '#dc2626', border: 'rgba(239,68,68,0.3)'  },
  USED:      { label: 'Fully used',  bg: 'rgba(107,114,128,0.10)', text: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  CANCELLED: { label: 'Cancelled',   bg: 'rgba(107,114,128,0.10)', text: '#6b7280', border: 'rgba(107,114,128,0.3)' },
}

function StatusBadge({ status }) {
  const s = PKG_STATUS[status] ?? PKG_STATUS.ACTIVE
  return (
    <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-widest uppercase border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {s.label}
    </span>
  )
}

const TYPE_STYLE = {
  CLASSIC:   { label: 'Classic',   gradient: 'linear-gradient(135deg,rgba(201,169,110,0.12),rgba(201,169,110,0.04))' },
  PREMIUM:   { label: 'Premium',   gradient: 'linear-gradient(135deg,rgba(155,90,110,0.15),rgba(201,169,110,0.06))' },
  EXCLUSIVE: { label: 'Exclusive', gradient: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(201,169,110,0.06))' },
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
}) : '—'

const daysLeft = (expiry) => {
  if (!expiry) return null
  const diff = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

function SessionBar({ used = 0, included = 0 }) {
  const remaining = Math.max(0, included - used)
  const pct = included > 0 ? Math.min(100, Math.round((remaining / included) * 100)) : 0
  const tone = remaining === 0 ? '#dc2626' : remaining <= 2 ? '#c9a96e' : '#16a34a'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] tracking-widest uppercase text-white/30">Sessions left</p>
        <p className="text-sm font-semibold" style={{ color: tone }}>
          {remaining} / {included}
        </p>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  )
}

function PkgCard({ pkg }) {
  const [open, setOpen] = useState(false)
  const style = TYPE_STYLE[pkg.package_type] ?? TYPE_STYLE.CLASSIC
  const days  = daysLeft(pkg.expiry_date)
  const isActive = pkg.status === 'ACTIVE'
  const included = pkg.sessions_included ?? 0
  const used = pkg.sessions_used ?? 0
  const remaining = pkg.sessions_remaining ?? Math.max(0, included - used)
  const benefits = Array.isArray(pkg.benefits) ? pkg.benefits : []
  const usages = Array.isArray(pkg.usages) ? pkg.usages : []

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ background: isActive ? style.gradient : 'rgba(255,255,255,0.02)', borderColor: isActive ? 'rgba(201,169,110,0.25)' : 'rgba(255,255,255,0.07)' }}>

      <div className="flex items-center justify-between px-5 py-4 cursor-pointer gap-3"
        onClick={() => setOpen(o => !o)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
              {style.label}
            </p>
          </div>
          <p className="text-white font-semibold text-base truncate">{pkg.package_name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            Purchased {fmtDate(pkg.purchase_date)}
            {included > 0 && (
              <span className="ml-2" style={{ color: remaining === 0 ? '#f87171' : 'rgba(255,255,255,0.45)' }}>
                · {remaining} of {included} session{included === 1 ? '' : 's'} left
              </span>
            )}
            {days !== null && isActive && (
              <span className={`ml-2 font-medium ${days <= 7 ? 'text-red-400' : 'text-green-400'}`}>
                · {days > 0 ? `${days} days left` : 'Expires today'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={pkg.status} />
          <svg className="w-4 h-4 text-white/30 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}
            className="overflow-hidden">
            <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Package Price',  value: `₹${Number(pkg.package_price ?? 0).toLocaleString('en-IN')}`, gold: true },
                  { label: 'Purchase Date',  value: fmtDate(pkg.purchase_date) },
                  { label: 'Expires On',     value: fmtDate(pkg.expiry_date) },
                  { label: 'Used',           value: `${used} session${used === 1 ? '' : 's'}` },
                  { label: 'Remaining',      value: `${remaining} session${remaining === 1 ? '' : 's'}`, gold: true },
                  { label: 'Package ID',     value: `#${pkg.id}` },
                ].map(({ label, value, gold }) => (
                  <div key={label}>
                    <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">{label}</p>
                    <p className="text-sm font-medium" style={{ color: gold ? 'var(--gold)' : 'rgba(255,255,255,0.8)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {included > 0 && (
                <div className="mb-5">
                  <SessionBar used={used} included={included} />
                </div>
              )}

              {benefits.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>
                    Remaining by service
                  </p>
                  <div className="space-y-2">
                    {benefits.map((b) => (
                      <div
                        key={b.service}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <p className="text-sm text-white/80 truncate pr-3">{b.service_name}</p>
                        <p className="text-xs font-semibold flex-shrink-0" style={{ color: b.remaining === 0 ? '#f87171' : 'var(--gold)' }}>
                          {b.remaining} / {b.included} left
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>
                  Usage history
                </p>
                {usages.length === 0 ? (
                  <p className="text-xs text-white/35">No sessions used yet. Book a service included in this package to start using it.</p>
                ) : (
                  <div className="space-y-2">
                    {usages.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <p className="text-sm text-white/80 truncate pr-3">{u.service_name}</p>
                        <p className="text-[11px] text-white/35 flex-shrink-0">{fmtDateTime(u.used_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to={`/packages/${pkg.package}`}
                  className="inline-flex items-center gap-2 text-xs tracking-widest uppercase font-medium transition-colors"
                  style={{ color: 'var(--gold)' }}>
                  View Package Details →
                </Link>
                {isActive && remaining > 0 && (
                  <Link to="/book"
                    className="inline-flex items-center gap-2 text-xs tracking-widest uppercase font-medium text-white/40 hover:text-white/70">
                    Book a session
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MyPackages() {
  const [packages, setPackages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    bookingApi.getMyPackages()
      .then(({ data }) => setPackages(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setError('Could not load your packages.'))
      .finally(() => setLoading(false))
  }, [])

  const active  = packages.filter(p => p.status === 'ACTIVE')
  const expired = packages.filter(p => p.status !== 'ACTIVE')

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0a0a 0%,#110d0a 60%,#0d0a11 100%)' }}>
      <div className="pt-28 pb-10 px-4 text-center">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: 'var(--gold)' }}>My Account</p>
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">My Packages</h1>
        <p className="text-white/40 text-sm">Remaining sessions and usage history for your bundles.</p>
        <div className="flex justify-center gap-4 mt-6">
          <Link to="/account"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase border transition-all hover:border-white/30"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }}>
            ← My Profile
          </Link>
          <Link to="/packages"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase font-semibold"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}>
            Browse Packages →
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {loading && (
          <div className="space-y-3">
            {[...Array(2)].map((_,i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}
        {error && <p className="text-center text-red-400 py-12">{error}</p>}

        {!loading && !error && (
          <div className="space-y-8">
            {active.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>
                  Active ({active.length})
                </p>
                <div className="space-y-3">
                  {active.map(p => <PkgCard key={p.id} pkg={p} />)}
                </div>
              </div>
            )}

            {expired.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3 text-white/30">
                  Past ({expired.length})
                </p>
                <div className="space-y-3">
                  {expired.map(p => <PkgCard key={p.id} pkg={p} />)}
                </div>
              </div>
            )}

            {packages.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">📦</p>
                <p className="text-white/30 text-sm mb-6">You haven't purchased any packages yet.</p>
                <Link to="/packages"
                  className="px-7 py-3 rounded-full text-sm font-semibold tracking-widest uppercase"
                  style={{ background: 'var(--gold)', color: '#0a0a0a' }}>
                  Explore Packages →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
