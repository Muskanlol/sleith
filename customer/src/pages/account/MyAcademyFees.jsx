import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingApi, loadRazorpay } from '../../api/booking.api'
import { useAuth } from '../../context/AuthContext'
import { AcademySubNav } from './AcademyAccountShell'

const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

const FEE_STATUS = {
  PENDING: { label: 'Pending', bg: 'rgba(234,179,8,0.12)',  text: '#ca8a04', border: 'rgba(234,179,8,0.3)'  },
  PAID:    { label: 'Paid',    bg: 'rgba(34,197,94,0.10)',  text: '#16a34a', border: 'rgba(34,197,94,0.3)'  },
  OVERDUE: { label: 'Overdue', bg: 'rgba(239,68,68,0.10)',  text: '#dc2626', border: 'rgba(239,68,68,0.3)'  },
  WAIVED:  { label: 'Waived',  bg: 'rgba(99,102,241,0.10)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function FeeCard({ fee, onPaySuccess }) {
  const { user }              = useAuth()
  const [paying, setPaying]   = useState(false)
  const [paid,   setPaid]     = useState(false)
  const [err,    setErr]      = useState(null)
  const [open,   setOpen]     = useState(false)

  const canPay = !paid && fee.status === 'PENDING'
  const s      = FEE_STATUS[fee.status] ?? FEE_STATUS.PENDING

  const handlePay = async () => {
    setPaying(true); setErr(null)
    try {
      const { data: order } = await bookingApi.createPaymentOrder({
        payment_for:   'ACADEMY',
        academy_fee_id: fee.id,
      })
      const Rzp = await loadRazorpay()
      new Rzp({
        key:         KEY,
        amount:      order.amount,
        currency:    order.currency ?? 'INR',
        order_id:    order.order_id ?? order.razorpay_order_id,
        name:        'SLEITH Academy',
        description: `Fee for ${fee.batch_name}`,
        handler: async (res) => {
          try {
            await bookingApi.verifyPayment(res)
            setPaid(true); onPaySuccess?.()
          } catch { setErr('Payment verification failed. Contact support.') }
        },
        prefill: { name: user?.full_name ?? '', email: user?.email ?? '' },
        theme:   { color: '#9b5a6e' },
        modal:   { ondismiss: () => setPaying(false) },
      }).open()
    } catch (err) {
      setErr(err?.response?.data?.error ?? 'Could not open payment.')
      setPaying(false)
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background:  canPay ? 'linear-gradient(135deg,rgba(155,90,110,0.1),rgba(201,169,110,0.04))' : 'rgba(255,255,255,0.025)',
        borderColor: canPay ? 'rgba(155,90,110,0.3)' : 'rgba(255,255,255,0.07)',
      }}>

      <div className="flex items-center justify-between px-5 py-4 cursor-pointer gap-3"
        onClick={() => setOpen(o => !o)}>
        <div className="min-w-0">
          <p className="text-white font-medium text-sm truncate">{fee.batch_name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            Due {fmtDate(fee.due_date)} · ₹{Number(fee.amount).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-widest uppercase border"
            style={{ background: paid ? 'rgba(34,197,94,0.10)' : s.bg, color: paid ? '#16a34a' : s.text, borderColor: paid ? 'rgba(34,197,94,0.3)' : s.border }}>
            {paid ? 'Paid' : s.label}
          </span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Course / Batch', value: fee.batch_name },
                  { label: 'Amount',         value: `₹${Number(fee.amount).toLocaleString('en-IN')}`, gold: true },
                  { label: 'Due Date',       value: fmtDate(fee.due_date) },
                  { label: 'Paid On',        value: fmtDate(fee.paid_date) || '—' },
                  { label: 'Fee #',          value: `#${fee.id}` },
                ].map(({ label, value, gold }) => (
                  <div key={label}>
                    <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">{label}</p>
                    <p className="text-sm font-medium" style={{ color: gold ? 'var(--gold)' : 'rgba(255,255,255,0.8)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {canPay && !paid && (
                <button onClick={handlePay} disabled={paying}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#9b5a6e,#c9a96e)', color: '#fff' }}>
                  {paying
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                    : '💳'} Pay ₹{Number(fee.amount).toLocaleString('en-IN')}
                </button>
              )}
              {paid && (
                <span className="px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}>
                  ✓ Paid
                </span>
              )}
              {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MyAcademyFees() {
  const [fees,    setFees]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    bookingApi.getMyFees()
      .then(({ data }) => setFees(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setError('Could not load your fees.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const pending = fees.filter(f => f.status === 'PENDING')
  const done    = fees.filter(f => f.status !== 'PENDING')

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0a0a 0%,#120a0d 60%,#0d0a11 100%)' }}>
      <div className="pt-28 pb-10 px-4 text-center">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: '#c97b90' }}>
          My Academy
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">Course Fees</h1>
        <p className="text-white/40 text-sm">Track and pay your academy fee installments.</p>
        <div className="flex justify-center gap-4 mt-6">
          <Link to="/account"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase border transition-all hover:border-white/30"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }}>
            ← My Profile
          </Link>
          <Link to="/academy"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase font-semibold"
            style={{ background: 'linear-gradient(135deg,#9b5a6e,#c9a96e)', color: '#fff' }}>
            Browse Courses →
          </Link>
        </div>
        <AcademySubNav />
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
            {pending.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#c97b90' }}>
                  Pending Payment ({pending.length})
                </p>
                <div className="space-y-3">
                  {pending.map(f => <FeeCard key={f.id} fee={f} onPaySuccess={load} />)}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-3 text-white/30">
                  Paid / Waived ({done.length})
                </p>
                <div className="space-y-3">
                  {done.map(f => <FeeCard key={f.id} fee={f} onPaySuccess={load} />)}
                </div>
              </div>
            )}
            {fees.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🎓</p>
                <p className="text-white/30 text-sm mb-6">No fee records found. Apply to a course to get started.</p>
                <Link to="/academy"
                  className="px-7 py-3 rounded-full text-sm font-semibold tracking-widest uppercase"
                  style={{ background: 'linear-gradient(135deg,#9b5a6e,#c9a96e)', color: '#fff' }}>
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
