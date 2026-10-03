import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingApi, generateSlots, loadRazorpay } from '../../api/booking.api'
import { useAuth } from '../../context/AuthContext'
import MiniCalendar, { DAY_MAP } from '../../components/common/MiniCalendar'

const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID
const CHANGEABLE = ['PENDING', 'CONFIRMED', 'RESCHEDULED']

const STATUS = {
  PENDING: { label: 'Pending', bg: 'rgba(234,179,8,0.12)', text: '#ca8a04', border: 'rgba(234,179,8,0.3)' },
  CONFIRMED: { label: 'Confirmed', bg: 'rgba(34,197,94,0.10)', text: '#16a34a', border: 'rgba(34,197,94,0.3)' },
  RESCHEDULED: { label: 'Rescheduled', bg: 'rgba(59,130,246,0.10)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  COMPLETED: { label: 'Completed', bg: 'rgba(99,102,241,0.10)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239,68,68,0.10)', text: '#dc2626', border: 'rgba(239,68,68,0.3)' },
}

function firstError(data, fallback) {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.error) return data.error
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : String(data.detail)
  for (const v of Object.values(data)) {
    if (typeof v === 'string') return v
    if (Array.isArray(v) && v[0]) return typeof v[0] === 'string' ? v[0] : fallback
  }
  return fallback
}

function startsAt(appt) {
  const t = String(appt.start_time || '00:00:00').slice(0, 8)
  return new Date(`${appt.appointment_date}T${t}`)
}

function hoursUntil(appt) {
  return (startsAt(appt).getTime() - Date.now()) / 36e5
}

function durationMinutes(appt) {
  const [sh, sm] = String(appt.start_time || '00:00').split(':').map(Number)
  const [eh, em] = String(appt.end_time || '01:00').split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return mins > 0 ? mins : 60
}

function Stars({ value = 0, size = 16, onSelect, interactive = false }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => interactive && setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(n)}
          onClick={() => interactive && onSelect?.(n)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          style={{
            fontSize: size,
            color: n <= shown ? '#C9A96E' : 'rgba(255,255,255,0.18)',
            lineHeight: 1,
            background: 'none',
            border: 'none',
            padding: 0,
          }}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewBox({ appt, onSaved }) {
  const existing = appt.review
  const canWrite = !existing || existing.status === 'PENDING' || existing.status === 'REJECTED'
  const [rating, setRating] = useState(existing?.rating || 0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [open, setOpen] = useState(!existing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(false)

  const submit = async () => {
    if (!rating) { setError('Please choose a rating.'); return }
    setSaving(true); setError(null)
    try {
      if (existing?.id) {
        await bookingApi.updateReview(existing.id, { rating, comment })
      } else {
        await bookingApi.createReview({ appointment: appt.id, rating, comment })
      }
      setOk(true)
      setOpen(false)
      onSaved?.()
    } catch (err) {
      const d = err?.response?.data
      setError(d?.appointment?.[0] || d?.rating?.[0] || d?.error || 'Could not submit review.')
    } finally {
      setSaving(false)
    }
  }

  if (existing?.status === 'APPROVED' && !open) {
    return (
      <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
        <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--gold)' }}>Your review</p>
        <Stars value={existing.rating} />
        {existing.comment && <p className="text-xs text-white/50 mt-2">{existing.comment}</p>}
      </div>
    )
  }

  if (existing && !open) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs" style={{ color: existing.status === 'REJECTED' ? '#e57373' : 'rgba(255,255,255,0.4)' }}>
          {existing.status === 'PENDING' && 'Review submitted — awaiting approval'}
          {existing.status === 'REJECTED' && 'Review was not published. You can edit and resubmit.'}
        </p>
        {canWrite && (
          <button type="button" onClick={() => setOpen(true)}
            className="text-xs font-medium" style={{ color: 'var(--gold)' }}>
            {existing.status === 'REJECTED' ? 'Edit review' : 'Edit'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.18)' }}>
      <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
        {existing ? 'Update your review' : 'Leave a review'}
      </p>
      <Stars value={rating} size={22} interactive onSelect={setRating} />
      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {ok && <p className="text-xs" style={{ color: '#16a34a' }}>Sent! We’ll publish it after approval.</p>}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={saving}
          className="px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}>
          {saving ? 'Sending…' : existing ? 'Resubmit' : 'Submit review'}
        </button>
        {existing && (
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-full text-xs text-white/40">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.PENDING
  return (
    <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-widest uppercase border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {s.label}
    </span>
  )
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const to12h = (t = '') => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function ReschedulePanel({ appt, onDone, onClose }) {
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [selDate, setSelDate] = useState(null)
  const [selSlot, setSelSlot] = useState(null)
  const [saving, setSaving] = useState(false)

  const duration = durationMinutes(appt)

  useEffect(() => {
    if (!appt.staff) {
      setLoadError('Could not load stylist availability.')
      setLoading(false)
      return
    }
    bookingApi.getStaffAvailability(appt.staff)
      .then(({ data }) => setAvailability(Array.isArray(data) ? data : []))
      .catch(() => setLoadError('Could not load availability.'))
      .finally(() => setLoading(false))
  }, [appt.staff])

  const availableDayNums = useMemo(
    () => availability.map((a) => DAY_MAP[a.day]).filter((n) => n !== undefined),
    [availability],
  )

  const slots = useMemo(
    () => generateSlots(availability, selDate, duration),
    [availability, selDate, duration],
  )

  const save = async () => {
    if (!selDate || !selSlot) return
    setSaving(true)
    setSaveError(null)
    try {
      await bookingApi.rescheduleAppointment(appt.id, {
        appointment_date: selDate.toLocaleDateString('en-CA'),
        start_time: selSlot.start_time,
        end_time: selSlot.end_time,
      })
      onDone?.()
    } catch (err) {
      setSaveError(firstError(err?.response?.data, 'Could not reschedule.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl p-4 space-y-4"
      style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.18)' }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
          Pick a new date & time
        </p>
        <button type="button" onClick={onClose} className="text-xs text-white/40">Close</button>
      </div>
      {loading && <div className="h-40 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />}
      {loadError && <p className="text-xs text-red-400">{loadError}</p>}
      {saveError && <p className="text-xs text-red-400">{saveError}</p>}
      {!loading && !loadError && (
        <div className="grid md:grid-cols-2 gap-4">
          <MiniCalendar
            availableDayNums={availableDayNums}
            selectedDate={selDate}
            onSelect={(date) => { setSelDate(date); setSelSlot(null) }}
          />
          <div>
            <p className="text-white/50 text-[10px] tracking-widest uppercase mb-3">
              {selDate
                ? selDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Select a date'}
            </p>
            {!selDate && <p className="text-white/25 text-xs">Pick an available day.</p>}
            {selDate && slots.length === 0 && <p className="text-white/30 text-xs">No slots on this day.</p>}
            {selDate && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const isSel = selSlot?.start_time === slot.start_time
                  return (
                    <button
                      key={slot.start_time}
                      type="button"
                      onClick={() => setSelSlot(isSel ? null : slot)}
                      className="py-2 rounded-xl text-xs font-medium border"
                      style={{
                        background: isSel ? 'var(--gold)' : 'rgba(201,169,110,0.06)',
                        color: isSel ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                        borderColor: isSel ? 'var(--gold)' : 'rgba(201,169,110,0.15)',
                      }}
                    >
                      {to12h(slot.start_time)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <button
        type="button"
        disabled={!selDate || !selSlot || saving}
        onClick={save}
        className="px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase disabled:opacity-50"
        style={{ background: 'var(--gold)', color: '#0a0a0a' }}
      >
        {saving ? 'Saving…' : 'Confirm new time'}
      </button>
    </div>
  )
}

function ApptCard({ appt, onChanged, onReviewSaved }) {
  const { user } = useAuth()
  const [paying, setPaying] = useState(false)
  const [payDone, setPayDone] = useState(false)
  const [payErr, setPayErr] = useState(null)
  const [open, setOpen] = useState(false)
  const [actionErr, setActionErr] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

  const total = appt.services?.reduce((s, sv) => s + parseFloat(sv.price_at_booking ?? 0), 0) ?? 0
  const usedPkg = appt.services?.some((sv) => sv.is_package_used)
  const isPast = hoursUntil(appt) < 0
  const canPay = !payDone && CHANGEABLE.includes(appt.status) && !isPast && total > 0 && !usedPkg
  const canManage = CHANGEABLE.includes(appt.status) && hoursUntil(appt) >= 4
  const tooClose = CHANGEABLE.includes(appt.status) && !isPast && hoursUntil(appt) < 4

  const handlePay = async () => {
    setPaying(true); setPayErr(null)
    try {
      const { data: order } = await bookingApi.createPaymentOrder({
        payment_for: 'APPOINTMENT', appointment_id: appt.id,
      })
      const Rzp = await loadRazorpay()
      new Rzp({
        key: KEY, amount: order.amount, currency: order.currency ?? 'INR',
        order_id: order.order_id ?? order.razorpay_order_id,
        name: 'SLEITH', description: `Appointment #${appt.id}`,
        handler: async (res) => {
          try {
            await bookingApi.verifyPayment(res)
            setPayDone(true); onChanged?.()
          } catch { setPayErr('Verification failed. Contact support.') }
        },
        prefill: { name: user?.full_name ?? '', email: user?.email ?? '' },
        theme: { color: '#c9a96e' },
        modal: { ondismiss: () => setPaying(false) },
      }).open()
    } catch (err) {
      setPayErr(err?.response?.data?.error ?? 'Could not open payment.')
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm(
      'Cancel this appointment? Payments are not refunded automatically — contact the salon if you already paid.',
    )) return
    setCancelling(true)
    setActionErr(null)
    try {
      await bookingApi.cancelAppointment(appt.id)
      onChanged?.()
    } catch (err) {
      setActionErr(firstError(err?.response?.data, 'Could not cancel.'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: isPast ? 'rgba(255,255,255,0.07)' : 'rgba(201,169,110,0.2)' }}>

      <div className="flex items-center justify-between px-5 py-4 cursor-pointer gap-3"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
            style={{ background: isPast ? 'rgba(255,255,255,0.05)' : 'rgba(201,169,110,0.12)', border: `1px solid ${isPast ? 'rgba(255,255,255,0.08)' : 'rgba(201,169,110,0.25)'}` }}>
            <span className="text-[9px] uppercase tracking-widest" style={{ color: isPast ? 'rgba(255,255,255,0.3)' : 'var(--gold)' }}>
              {new Date(appt.appointment_date).toLocaleDateString('en-IN', { month: 'short' })}
            </span>
            <span className="text-lg font-bold leading-none" style={{ color: isPast ? 'rgba(255,255,255,0.4)' : 'white' }}>
              {new Date(appt.appointment_date).getDate()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {appt.services?.map(s => s.service_name).join(', ') || 'Appointment'}
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              {appt.staff_name} · {to12h(appt.start_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={appt.status} />
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
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden">
            <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Date', value: fmtDate(appt.appointment_date) },
                  { label: 'Time', value: `${to12h(appt.start_time)} – ${to12h(appt.end_time)}` },
                  { label: 'Stylist', value: appt.staff_name ?? '—' },
                  { label: 'Amount', value: `₹${total.toLocaleString('en-IN')}`, gold: true },
                  { label: 'Booking #', value: `#${appt.id}` },
                  ...(appt.notes ? [{ label: 'Notes', value: appt.notes }] : []),
                ].map(({ label, value, gold }) => (
                  <div key={label}>
                    <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">{label}</p>
                    <p className="text-sm font-medium" style={{ color: gold ? 'var(--gold)' : 'rgba(255,255,255,0.8)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {appt.services?.length > 0 && (
                <div className="rounded-xl p-3 mb-4 space-y-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {appt.services.map(sv => (
                    <div key={sv.id} className="flex justify-between text-xs">
                      <span className="text-white/50">{sv.service_name}</span>
                      <span style={{ color: 'var(--gold)' }}>
                        {sv.is_package_used ? 'Package' : `₹${Number(sv.price_at_booking).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                {canPay && (
                  <button onClick={handlePay} disabled={paying}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase transition-all disabled:opacity-60"
                    style={{ background: 'var(--gold)', color: '#0a0a0a' }}>
                    {paying
                      ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                      : '💳'} Pay ₹{total.toLocaleString('en-IN')}
                  </button>
                )}
                {payDone && (
                  <span className="px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}>
                    ✓ Paid
                  </span>
                )}
                {appt.status === 'COMPLETED' && (
                  <Link to="/book"
                    className="px-4 py-2 rounded-full text-xs font-medium tracking-widest uppercase border transition-all hover:border-white/30"
                    style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }}>
                    Book Again →
                  </Link>
                )}
                {canManage && (
                  <>
                    <button type="button" onClick={() => setRescheduling(v => !v)}
                      className="px-4 py-2 rounded-full text-xs font-medium tracking-widest uppercase border transition-all hover:border-gold/40"
                      style={{ color: 'rgba(201,169,110,0.8)', borderColor: 'rgba(201,169,110,0.25)' }}>
                      {rescheduling ? 'Close' : 'Reschedule'}
                    </button>
                    <button type="button" onClick={handleCancel} disabled={cancelling}
                      className="px-4 py-2 rounded-full text-xs font-medium tracking-widest uppercase border transition-all disabled:opacity-50"
                      style={{ color: 'rgba(239,68,68,0.85)', borderColor: 'rgba(239,68,68,0.25)' }}>
                      {cancelling ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </>
                )}
              </div>
              {tooClose && (
                <p className="mt-2 text-xs text-white/35">
                  Changes must be made at least 4 hours before the appointment.
                </p>
              )}
              {payErr && <p className="mt-2 text-xs text-red-400">{payErr}</p>}
              {actionErr && <p className="mt-2 text-xs text-red-400">{actionErr}</p>}
              {rescheduling && canManage && (
                <ReschedulePanel
                  appt={appt}
                  onClose={() => setRescheduling(false)}
                  onDone={() => { setRescheduling(false); onChanged?.() }}
                />
              )}
              {appt.status === 'COMPLETED' && (
                <ReviewBox appt={appt} onSaved={onReviewSaved} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('upcoming')

  const load = useCallback(() => {
    setLoading(true)
    bookingApi.getMyAppointments()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results ?? []
        setAppointments(list.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)))
      })
      .catch(() => setError('Could not load appointments.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const upcoming = appointments.filter(a => new Date(a.appointment_date) >= today && a.status !== 'CANCELLED')
  const past = appointments.filter(a => new Date(a.appointment_date) < today || a.status === 'CANCELLED')
  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0a0a 0%,#110d0a 60%,#0d0a11 100%)' }}>
      <div className="pt-28 pb-10 px-4 text-center">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: 'var(--gold)' }}>My Account</p>
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">My Appointments</h1>
        <p className="text-white/40 text-sm">Track, manage and pay for your bookings.</p>
        <div className="flex justify-center gap-4 mt-6">
          <Link to="/account"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase border transition-all hover:border-white/30"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }}>
            ← My Profile
          </Link>
          <Link to="/book"
            className="px-5 py-2 rounded-full text-xs tracking-widest uppercase font-semibold"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}>
            + New Booking
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="flex rounded-xl p-1 mb-6 gap-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'past', label: `Past (${past.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 rounded-lg text-xs tracking-widest uppercase font-medium transition-all duration-300"
              style={{
                background: tab === t.key ? 'rgba(201,169,110,0.15)' : 'transparent',
                color: tab === t.key ? 'var(--gold)' : 'rgba(255,255,255,0.35)',
                border: tab === t.key ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}

        {error && <p className="text-center text-red-400 py-12">{error}</p>}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="space-y-3">
              {shown.map(appt => (
                <ApptCard key={appt.id} appt={appt} onChanged={load} onReviewSaved={load} />
              ))}
              {shown.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-5xl mb-4">{tab === 'upcoming' ? '📅' : '🗂️'}</p>
                  <p className="text-white/30 text-sm mb-6">
                    {tab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments yet.'}
                  </p>
                  {tab === 'upcoming' && (
                    <Link to="/book"
                      className="px-7 py-3 rounded-full text-sm font-semibold tracking-widest uppercase"
                      style={{ background: 'var(--gold)', color: '#0a0a0a' }}>
                      Book Now →
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
