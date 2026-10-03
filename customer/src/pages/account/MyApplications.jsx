import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { academyApi } from '../../api/academy.api'
import { AcademySubNav } from './AcademyAccountShell'

const STATUS = {
  PENDING:            { label: 'Under Review',       bg: 'rgba(234,179,8,0.1)',   text: '#ca8a04', border: 'rgba(234,179,8,0.28)'  },
  AWAITING_RESPONSE:  { label: 'Action Required',    bg: 'rgba(155,90,110,0.15)', text: '#c97b90', border: 'rgba(155,90,110,0.4)'  },
  APPROVED:           { label: 'Approved',           bg: 'rgba(34,197,94,0.09)',  text: '#16a34a', border: 'rgba(34,197,94,0.28)'  },
  REJECTED:           { label: 'Not Selected',       bg: 'rgba(239,68,68,0.09)',  text: '#dc2626', border: 'rgba(239,68,68,0.28)'  },
}

function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.PENDING
  return (
    <span
      className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-[0.12em] uppercase border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {s.label}
    </span>
  )
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function AppCard({ app, onRefresh }) {
  const [open,       setOpen]       = useState(app.status === 'AWAITING_RESPONSE') // auto-open if action needed
  const [responding, setResponding] = useState(false)
  const [respError,  setRespError]  = useState(null)

  const isApproved  = app.status === 'APPROVED'
  const isRejected  = app.status === 'REJECTED'
  const needsAction = app.status === 'AWAITING_RESPONSE'

  const respond = async (choice) => {
    setResponding(true)
    setRespError(null)
    try {
      await academyApi.respondToApplication(app.id, choice)
      onRefresh()
    } catch (err) {
      setRespError(err?.response?.data?.error || 'Something went wrong.')
      setResponding(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: isApproved
          ? 'linear-gradient(135deg, rgba(155,90,110,0.1), rgba(201,169,110,0.04))'
          : 'rgba(255,255,255,0.025)',
        borderColor: isApproved
          ? 'rgba(155,90,110,0.3)'
          : isRejected
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(234,179,8,0.2)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer gap-3"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="min-w-0">
          <p className="text-white font-semibold text-[15px] truncate">{app.course_name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            Applied {fmtDate(app.applied_at || app.created_at)}
            {app.batch_name && ` · Batch: ${app.batch_name}`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={app.status} />
          <svg
            className="w-4 h-4 text-white/30 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Course',         value: app.course_name },
                  { label: 'Status',         value: STATUS[app.status]?.label || app.status },
                  { label: 'Applied On',     value: fmtDate(app.applied_at || app.created_at) },
                  { label: 'Reviewed On',    value: fmtDate(app.reviewed_at) },
                  ...(app.batch_name ? [{ label: 'Batch', value: app.batch_name }] : []),
                  { label: 'Application #',  value: `#${app.id}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">{label}</p>
                    <p className="text-sm font-medium text-white/80">{value}</p>
                  </div>
                ))}
              </div>

              {needsAction && app.admin_note && (
                <div className="rounded-xl p-4 mb-3 space-y-3"
                  style={{ background: 'rgba(155,90,110,0.1)', border: '1px solid rgba(155,90,110,0.35)' }}>
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#c97b90' }}>
                    📬 Message from SLEITH Academy
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{app.admin_note}</p>

                  {!app.customer_response && (
                    <div className="pt-1">
                      <p className="text-xs text-white/40 mb-2">Please respond so we can proceed:</p>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => respond('ACCEPTED')}
                          disabled={responding}
                          className="px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50 transition-all"
                          style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff' }}
                        >
                          {responding ? '…' : '✓ Yes, I agree'}
                        </button>
                        <button
                          onClick={() => respond('DECLINED')}
                          disabled={responding}
                          className="px-5 py-2 rounded-full text-sm font-medium border disabled:opacity-50 transition-all"
                          style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.4)' }}
                        >
                          {responding ? '…' : '✗ No, cancel my application'}
                        </button>
                      </div>
                      {respError && <p className="text-xs text-red-400 mt-2">{respError}</p>}
                    </div>
                  )}

                  {app.customer_response && (
                    <p className="text-xs" style={{ color: app.customer_response === 'ACCEPTED' ? '#4ade80' : '#f87171' }}>
                      You responded: <strong>{app.customer_response === 'ACCEPTED' ? 'Accepted ✓' : 'Declined ✗'}</strong>
                    </p>
                  )}
                </div>
              )}

              {app.status === 'APPROVED' && (
                <div
                  className="rounded-xl px-4 py-3 text-sm mb-3"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}
                >
                  🎉 Congratulations — your application is approved. When you are assigned to a batch, it will show under{' '}
                  <Link to="/account/academy" className="underline underline-offset-2">My Enrollments</Link>.
                </div>
              )}
              {app.status === 'REJECTED' && (
                <div
                  className="rounded-xl px-4 py-3 text-sm mb-3"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}
                >
                  We weren't able to move forward with your application this time. You're welcome to apply again for a future batch.
                </div>
              )}
              {app.status === 'PENDING' && (
                <div
                  className="rounded-xl px-4 py-3 text-sm mb-3"
                  style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.18)', color: '#facc15' }}
                >
                  ⏳ Your application is under review. We'll notify you as soon as there's an update.
                </div>
              )}

              <Link
                to={`/academy/${app.course}`}
                className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase font-medium transition-colors"
                style={{ color: '#c97b90' }}
              >
                View Course →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MyApplications() {
  const [apps,    setApps]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchApps = useCallback(() => {
    setLoading(true)
    academyApi.getMyApplications()
      .then(({ data }) => setApps(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setError('Could not load your applications.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  const actionNeeded = apps.filter((a) => a.status === 'AWAITING_RESPONSE')
  const pending      = apps.filter((a) => a.status === 'PENDING')
  const approved     = apps.filter((a) => a.status === 'APPROVED')
  const rejected     = apps.filter((a) => a.status === 'REJECTED')

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #120a0d 60%, #0d0a11 100%)' }}
    >
      <div className="pt-28 pb-10 px-4 text-center">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: '#c97b90' }}>
          My Academy
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">My Applications</h1>
        <p className="text-white/40 text-sm">Track the status of your course applications.</p>
        <div className="flex justify-center gap-4 mt-6">
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

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {loading && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}

        {error && <p className="text-center text-red-400 py-12">{error}</p>}

        {!loading && !error && (
          <div className="space-y-8">
            {actionNeeded.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#c97b90' }}>
                  <span className="animate-pulse">●</span> Action Required ({actionNeeded.length})
                </p>
                <div className="space-y-3">
                  {actionNeeded.map((a) => <AppCard key={a.id} app={a} onRefresh={fetchApps} />)}
                </div>
              </div>
            )}

            {pending.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#ca8a04' }}>
                  Under Review ({pending.length})
                </p>
                <div className="space-y-3">
                  {pending.map((a) => <AppCard key={a.id} app={a} onRefresh={fetchApps} />)}
                </div>
              </div>
            )}

            {approved.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#4ade80' }}>
                  Approved ({approved.length})
                </p>
                <div className="space-y-3">
                  {approved.map((a) => <AppCard key={a.id} app={a} onRefresh={fetchApps} />)}
                </div>
              </div>
            )}

            {rejected.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3 text-white/25">
                  Past Applications ({rejected.length})
                </p>
                <div className="space-y-3">
                  {rejected.map((a) => <AppCard key={a.id} app={a} onRefresh={fetchApps} />)}
                </div>
              </div>
            )}

            {apps.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🎓</p>
                <p className="text-white/30 text-sm mb-6">
                  You haven't applied to any courses yet.
                </p>
                <Link
                  to="/academy"
                  className="px-7 py-3 rounded-full text-sm font-semibold tracking-widest uppercase"
                  style={{ background: 'linear-gradient(135deg,#9b5a6e,#c9a96e)', color: '#fff' }}
                >
                  Explore Courses →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
