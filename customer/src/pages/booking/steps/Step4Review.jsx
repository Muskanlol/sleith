import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { bookingApi } from '../../../api/booking.api'
import { asList } from '../../../lib/list'

function Row({ label, value, accent }) {
  return (
    <div
      className="flex items-start justify-between py-3.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-white/40 text-sm tracking-wide">{label}</span>
      <span
        className="text-sm font-medium text-right max-w-xs"
        style={{ color: accent ? 'var(--gold)' : 'rgba(255,255,255,0.85)' }}
      >
        {value}
      </span>
    </div>
  )
}

export default function Step4Review({ booking, update, onConfirm, onBack }) {
  const [loadingMode, setLoadingMode] = useState(null)
  const loading = Boolean(loadingMode)
  const [error,   setError]   = useState(null)
  const [exhausted, setExhausted] = useState(false)
  const [cover, setCover] = useState({ included: false, remaining: 0, pkgName: null })

  useEffect(() => {
    const serviceId = booking.service?.id
    if (!serviceId) return
    bookingApi.getMyPackages()
      .then(({ data }) => {
        const now = Date.now()
        let remaining = 0
        let included = false
        let pkgName = null
        for (const p of asList(data)) {
          if (p.status !== 'ACTIVE') continue
          if (p.expiry_date && new Date(p.expiry_date).getTime() < now) continue
          const b = (p.benefits || []).find((x) => x.service === serviceId)
          if (!b) continue
          included = true
          remaining += Number(b.remaining || 0)
          if (b.remaining > 0 && !pkgName) pkgName = p.package_name
        }
        setCover({ included, remaining, pkgName })
        setExhausted(included && remaining <= 0)
      })
      .catch(() => {})
  }, [booking.service?.id])

  const formatDate = (d) =>
    d?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const to12h = (t = '') => {
    if (!t) return ''
    const [h, m]  = t.split(':').map(Number)
    const ampm    = h >= 12 ? 'PM' : 'AM'
    const hour12  = h % 12 || 12
    return `${hour12}:${String(m).padStart(2,'0')} ${ampm}`
  }

  const submit = async (usePackage) => {
    setLoadingMode(usePackage ? 'package' : 'pay')
    setError(null)

    const payload = {
      staff:            booking.staff.id,
      appointment_date: booking.date.toLocaleDateString('en-CA'),
      start_time:       booking.slot.start_time,
      end_time:         booking.slot.end_time,
      notes:            booking.notes,
      services:         [booking.service.id],
      use_package:      usePackage,
    }

    try {
      const { data } = await bookingApi.createAppointment(payload)
      onConfirm(data)
    } catch (err) {
      const body = err?.response?.data ?? {}
      const code = Array.isArray(body.code) ? body.code[0] : body.code
      const pkgMsg = Array.isArray(body.use_package) ? body.use_package[0] : body.use_package
      if (code === 'PACKAGE_EXHAUSTED' || (typeof pkgMsg === 'string' && /used up/i.test(pkgMsg))) {
        setExhausted(true)
        setCover((c) => ({ ...c, remaining: 0 }))
        setError(pkgMsg || 'Oops — all remaining sessions for this service are used up. Please pay to book.')
      } else {
        const msg =
          pkgMsg ??
          body.non_field_errors?.[0] ??
          body.detail ??
          Object.values(body)[0] ??
          'Booking failed. Please try a different slot.'
        setError(Array.isArray(msg) ? msg[0] : msg)
      }
    } finally {
      setLoadingMode(null)
    }
  }

  return (
    <div className="pt-4 max-w-xl mx-auto">
      <div className="text-center mb-10">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: 'var(--gold)' }}>
          Step 4 of 4
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Review & Confirm</h2>
        <p className="text-white/50 text-sm">Double-check your appointment details before confirming.</p>
      </div>

      <div
        className="rounded-2xl border p-6 mb-6 relative"
        style={{
          background:  'linear-gradient(135deg, rgba(201,169,110,0.08), rgba(255,255,255,0.02))',
          borderColor: 'rgba(201,169,110,0.25)',
        }}
      >
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-2xl">
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full blur-xl"
            style={{ background: 'var(--gold)' }}
          />
        </div>

        <Row label="Service"   value={booking.service?.name}                  accent />
        <Row label="Stylist"   value={booking.staff?.name}                               />
        <Row label="Date"      value={formatDate(booking.date)}                           />
        <Row label="Time"      value={`${to12h(booking.slot?.start_time)} – ${to12h(booking.slot?.end_time)}`} />
        <Row label="Duration"  value={`${booking.service?.duration_minutes ?? booking.service?.duration} min`} />
        <Row
          label="Price"
          value={cover.included && cover.remaining > 0 && !exhausted
            ? `₹${Number(booking.service?.price ?? 0).toLocaleString('en-IN')} or use package`
            : `₹${Number(booking.service?.price ?? 0).toLocaleString('en-IN')}`}
          accent
        />
      </div>

      {cover.included && cover.remaining > 0 && !exhausted && (
        <div
          className="rounded-2xl border px-5 py-4 mb-6"
          style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.28)' }}
        >
          <p className="text-sm font-semibold text-white mb-1">Use from my package</p>
          <p className="text-xs text-white/50 leading-relaxed">
            {cover.pkgName ? `${cover.pkgName} includes this service. ` : 'This service is included in your package. '}
            {cover.remaining} session{cover.remaining === 1 ? '' : 's'} left — after this booking, {Math.max(0, cover.remaining - 1)} will remain.
          </p>
        </div>
      )}

      {exhausted && (
        <div
          className="rounded-2xl border px-5 py-4 mb-6"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.28)' }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>Oops — all sessions ended</p>
          <p className="text-xs text-white/50 leading-relaxed">
            You have used every remaining session for {booking.service?.name} on your package. Please pay to book this appointment.
          </p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-xs tracking-widest uppercase mb-2 text-white/40">
          Special Requests or Notes
        </label>
        <textarea
          rows={3}
          value={booking.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Any allergies, preferences, or requests..."
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none transition-all duration-300"
          style={{
            background:   'rgba(255,255,255,0.04)',
            border:       '1px solid rgba(255,255,255,0.1)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
          onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl text-sm text-center text-red-300"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3.5 rounded-full text-sm tracking-widest uppercase font-medium border transition-all duration-300 hover:border-white/30 disabled:opacity-40"
          style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)' }}
        >
          ← Back
        </button>
        {cover.included && cover.remaining > 0 && !exhausted && (
          <motion.button
            onClick={() => submit(true)}
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className="flex-[2] py-3.5 rounded-full text-sm tracking-widest uppercase font-semibold transition-all duration-300 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#052e16' }}
          >
            {loadingMode === 'package' ? 'Using package…' : 'Use from my package'}
          </motion.button>
        )}
        <motion.button
          onClick={() => submit(false)}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="flex-[2] py-3.5 rounded-full text-sm tracking-widest uppercase font-semibold transition-all duration-300 disabled:opacity-60"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          {loadingMode === 'pay' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Confirming…
            </span>
          ) : exhausted
            ? `Pay ₹${Number(booking.service?.price ?? 0).toLocaleString('en-IN')}`
            : cover.included && cover.remaining > 0
            ? `Pay instead — ₹${Number(booking.service?.price ?? 0).toLocaleString('en-IN')}`
            : 'Confirm Appointment'}
        </motion.button>
      </div>

      <p className="text-center text-white/20 text-[11px] mt-4">
        Free cancellation up to 4 hours before your appointment.
      </p>
    </div>
  )
}
