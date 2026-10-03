import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bookingApi, loadRazorpay } from '../../../api/booking.api'
import { useAuth } from '../../../context/AuthContext'

const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

function ConfettiBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
          animate={{
            y: [0, -80 - Math.random() * 60],
            x: [(Math.random() - 0.5) * 160],
            opacity: [1, 0],
            scale:   [1, 0.3],
          }}
          transition={{ delay: i * 0.05, duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${20 + (i / 14) * 60}%`,
            width:  6,
            height: 6,
            borderRadius: i % 2 ? '50%' : '2px',
            background: i % 3 === 0 ? '#c9a96e' : i % 3 === 1 ? '#f5e6c8' : '#9b5a6e',
          }}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    paid:    { label: 'Paid',             bg: 'rgba(34,197,94,0.15)',  text: '#4ade80', border: 'rgba(34,197,94,0.3)'  },
    package: { label: 'Used from package', bg: 'rgba(34,197,94,0.15)', text: '#4ade80', border: 'rgba(34,197,94,0.3)'  },
    pending: { label: 'Pending',          bg: 'rgba(201,169,110,0.12)', text: 'var(--gold)', border: 'rgba(201,169,110,0.3)' },
    failed:  { label: 'Failed',           bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.3)'  },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      className="text-xs px-3 py-1 rounded-full font-medium border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {s.label}
    </span>
  )
}

export default function Step5Success({ booking }) {
  const { user }                  = useAuth()
  const appt = booking.appointment
  const usedPackage = Boolean(booking.usedPackage || appt?.package_used)
  const [payStatus, setPayStatus] = useState(usedPackage ? 'package' : 'pending') // 'pending' | 'paid' | 'failed' | 'package'
  const [payLoading, setPayLoading] = useState(false)
  const [payError,   setPayError]   = useState(null)

  const to12h = (t = '') => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
  }

  const handlePayNow = async () => {
    setPayLoading(true)
    setPayError(null)
    try {
      const { data: order } = await bookingApi.createPaymentOrder({
        payment_for:     'APPOINTMENT',
        appointment_id:  appt.id,
      })

      const RazorpayClass = await loadRazorpay()

      const options = {
        key:         KEY,
        amount:      order.amount,
        currency:    order.currency ?? 'INR',
        order_id:    order.order_id ?? order.razorpay_order_id,
        name:        'SLEITH',
        description: `Appointment #${appt.id}`,
        image:       '/logo.png',
        handler: async (response) => {
          try {
            await bookingApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
            })
            setPayStatus('paid')
          } catch {
            setPayStatus('failed')
            setPayError('Payment verification failed. Contact support with your payment ID.')
          }
        },
        prefill: {
          name:  user?.full_name ?? user?.name ?? '',
          email: user?.email ?? '',
        },
        theme:     { color: '#c9a96e' },
        modal: {
          ondismiss: () => setPayLoading(false),
        },
      }

      const rzp = new RazorpayClass(options)
      rzp.on('payment.failed', () => {
        setPayStatus('failed')
        setPayError('Payment was declined. Please try another method.')
        setPayLoading(false)
      })
      rzp.open()
    } catch (err) {
      setPayError(err?.response?.data?.error ?? err?.response?.data?.detail ?? 'Could not initiate payment. Please try again.')
      setPayLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-16">
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="relative w-full max-w-md rounded-3xl border p-8 text-center overflow-hidden"
        style={{
          background:  'linear-gradient(160deg, rgba(201,169,110,0.12) 0%, rgba(255,255,255,0.02) 100%)',
          borderColor: 'rgba(201,169,110,0.35)',
        }}
      >
        <ConfettiBurst />

        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'var(--gold)' }}
        />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 16 }}
          className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: 'rgba(201,169,110,0.15)', border: '2px solid rgba(201,169,110,0.4)' }}
        >
          ✓
        </motion.div>

        <h2 className="font-serif text-3xl text-white mb-2">Booking Confirmed!</h2>
        <p className="text-white/50 text-sm mb-6">
          {usedPackage
            ? 'This visit was covered by your package. One session has been deducted.'
            : "We can't wait to see you. Your appointment is all set."}
        </p>

        <div
          className="rounded-xl p-4 mb-6 text-left space-y-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { label: 'Appointment #', value: `#${appt?.id ?? '—'}` },
            { label: 'Service',       value: booking.service?.name },
            { label: 'Stylist',       value: booking.staff?.user_name ?? booking.staff?.name },
            {
              label: 'Date & Time',
              value: booking.date
                ? `${booking.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}, ${to12h(booking.slot?.start_time)}`
                : '—',
            },
            { label: 'Amount',        value: usedPackage ? 'Covered by package' : `₹${Number(booking.service?.price ?? 0).toLocaleString('en-IN')}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-white/40">{label}</span>
              <span className="text-white/80 font-medium">{value}</span>
            </div>
          ))}

          <div className="flex justify-between items-center text-sm pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-white/40">Payment</span>
            <StatusBadge status={payStatus} />
          </div>
        </div>

        {payError && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-red-400 text-xs mb-4 px-2"
          >
            {payError}
          </motion.p>
        )}

        {payStatus === 'pending' && (
          <motion.button
            onClick={handlePayNow}
            disabled={payLoading}
            whileHover={!payLoading ? { scale: 1.03 } : {}}
            whileTap={!payLoading ? { scale: 0.97 } : {}}
            className="w-full py-3.5 rounded-full font-semibold text-sm tracking-widest uppercase mb-3 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            {payLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Opening Razorpay…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Pay Now — ₹{Number(booking.service?.price ?? 0).toLocaleString('en-IN')}
              </>
            )}
          </motion.button>
        )}

        {payStatus === 'package' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full py-3.5 rounded-full font-semibold text-sm tracking-widest uppercase mb-3 text-center"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            ✓ Used from my package
          </motion.div>
        )}

        {payStatus === 'paid' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full py-3.5 rounded-full font-semibold text-sm tracking-widest uppercase mb-3 text-center"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            ✓ Payment Successful
          </motion.div>
        )}

        {payStatus === 'pending' && (
          <p className="text-white/25 text-xs">or pay at the salon during your visit.</p>
        )}
      </motion.div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
        <Link
          to="/account/appointments"
          className="px-6 py-3 rounded-full text-sm tracking-widest uppercase border transition-all duration-300 hover:border-gold hover:text-white"
          style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}
        >
          My Appointments
        </Link>
        {usedPackage && (
          <Link
            to="/account/packages"
            className="px-6 py-3 rounded-full text-sm tracking-widest uppercase border transition-all duration-300 hover:border-gold hover:text-white"
            style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}
          >
            My Packages
          </Link>
        )}
        <Link
          to="/"
          className="px-6 py-3 rounded-full text-sm tracking-widest uppercase border transition-all duration-300"
          style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}
        >
          Back to Home
        </Link>
        <Link
          to="/book"
          className="px-6 py-3 rounded-full text-sm tracking-widest uppercase font-semibold transition-all duration-300"
          style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.3)' }}
        >
          Book Another →
        </Link>
      </div>
    </div>
  )
}
