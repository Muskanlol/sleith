import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingApi, generateSlots } from '../../../api/booking.api'
import MiniCalendar, { DAY_MAP } from '../../../components/common/MiniCalendar'

export default function Step3DateTime({ booking, onSelect, onBack }) {
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selDate, setSelDate] = useState(null)
  const [selSlot, setSelSlot] = useState(null)

  const duration = booking.service?.duration_minutes ?? booking.service?.duration ?? 60

  useEffect(() => {
    if (!booking.staff) return
    bookingApi.getStaffAvailability(booking.staff.id)
      .then(({ data }) => setAvailability(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load availability.'))
      .finally(() => setLoading(false))
  }, [booking.staff])

  const availableDayNums = useMemo(
    () => availability.map((a) => DAY_MAP[a.day]).filter((n) => n !== undefined),
    [availability],
  )

  const slots = useMemo(
    () => generateSlots(availability, selDate, duration),
    [availability, selDate, duration],
  )

  const handleDateSelect = (date) => {
    setSelDate(date)
    setSelSlot(null)
  }

  const canProceed = selDate && selSlot

  const formatDate = (d) =>
    d?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="pt-4">
      <div className="text-center mb-10">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: 'var(--gold)' }}>
          Step 3 of 4
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Pick a Date & Time</h2>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          {booking.staff
            ? `Showing ${booking.staff.user_name ?? booking.staff.name}'s available schedule.`
            : 'Select a convenient slot.'}
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={onBack}
          className="text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-all duration-300 hover:border-white/40"
          style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }}
        >
          ← Back to Stylists
        </button>
      </div>

      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-80 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      )}

      {error && <p className="text-center text-red-400 py-16">{error}</p>}

      {!loading && !error && (
        <div className="grid md:grid-cols-2 gap-6">
          <MiniCalendar
            availableDayNums={availableDayNums}
            selectedDate={selDate}
            onSelect={handleDateSelect}
          />

          <div
            className="rounded-2xl border p-5"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p className="text-white/60 text-xs tracking-widest uppercase mb-4">
              {selDate ? formatDate(selDate) : 'Select a date first'}
            </p>

            <AnimatePresence mode="wait">
              {!selDate && (
                <motion.p
                  key="prompt"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-white/20 text-sm mt-8 text-center"
                >
                  ← Pick an available day on the calendar
                </motion.p>
              )}

              {selDate && slots.length === 0 && (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-white/30 text-sm mt-8 text-center"
                >
                  No slots available on this day.
                </motion.p>
              )}

              {selDate && slots.length > 0 && (
                <motion.div
                  key={selDate.toDateString()}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-3 gap-2"
                >
                  {slots.map((slot) => {
                    const isSel = selSlot?.start_time === slot.start_time
                    return (
                      <button
                        key={slot.start_time}
                        onClick={() => setSelSlot(isSel ? null : slot)}
                        className="py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
                        style={{
                          background: isSel ? 'var(--gold)' : 'rgba(201,169,110,0.06)',
                          color: isSel ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                          borderColor: isSel ? 'var(--gold)' : 'rgba(201,169,110,0.15)',
                          boxShadow: isSel ? '0 0 16px rgba(201,169,110,0.35)' : undefined,
                        }}
                      >
                        {slot.label}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {slots.length > 0 && (
              <p className="mt-4 text-[10px] text-white/25 tracking-wide">
                Each slot is {duration} min · Service: {booking.service?.name}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <motion.button
          onClick={() => canProceed && onSelect(selDate, selSlot)}
          disabled={!canProceed}
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.98 } : {}}
          className="px-10 py-3.5 rounded-full font-semibold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: canProceed ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
            color: canProceed ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
          }}
        >
          {canProceed
            ? `Continue — ${selDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${selSlot?.label}`
            : 'Select a date & time to continue'}
        </motion.button>
      </div>
    </div>
  )
}
