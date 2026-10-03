import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { salonApi } from '../../api/salon.api'
import Step1Service  from './steps/Step1Service'
import Step2Staff    from './steps/Step2Staff'
import Step3DateTime from './steps/Step3DateTime'
import Step4Review   from './steps/Step4Review'
import Step5Success  from './steps/Step5Success'

const STEPS = [
  { num: 1, label: 'Service'  },
  { num: 2, label: 'Stylist'  },
  { num: 3, label: 'Date & Time' },
  { num: 4, label: 'Review'   },
]

const variants = {
  enter:  (dir) => ({ x: dir > 0 ? 72 : -72, opacity: 0 }),
  center: {        x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -72 : 72, opacity: 0 }),
}
const transition = { duration: 0.38, ease: [0.4, 0, 0.2, 1] }

export default function BookingPage() {
  const [searchParams] = useSearchParams()
  const [step,      setStep]      = useState(1)
  const [direction, setDirection] = useState(1)
  const [booking,   setBooking]   = useState({
    service:     null,
    staff:       null,
    date:        null,
    slot:        null,
    notes:       '',
    appointment: null,
    usedPackage: false,
  })

  const update = (field, value) =>
    setBooking((b) => ({ ...b, [field]: value }))

  const goNext = () => { setDirection(1);  setStep((s) => s + 1) }
  const goBack = () => { setDirection(-1); setStep((s) => s - 1) }

  useEffect(() => {
    const serviceId = searchParams.get('service')
    const staffId = searchParams.get('staff')
    if (!serviceId && !staffId) return
    let cancelled = false
    ;(async () => {
      const next = {}
      if (serviceId) {
        try {
          const { data } = await salonApi.getService(serviceId)
          if (!cancelled) next.service = data
        } catch {}
      }
      if (staffId) {
        try {
          const { data } = await salonApi.getStaffMember(staffId)
          if (!cancelled) next.staff = data
        } catch {}
      }
      if (cancelled || !Object.keys(next).length) return
      setBooking((b) => ({ ...b, ...next }))
      if (next.service && next.staff) setStep(3)
      else if (next.service) setStep(2)
    })()
    return () => { cancelled = true }
  }, [searchParams])

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #110d0a 50%, #0d0a11 100%)' }}
    >
      {step < 5 && (
        <div className="pt-28 pb-8 flex justify-center">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold border transition-all duration-500"
                    style={{
                      background:   step === s.num ? 'var(--gold)' : step > s.num ? 'var(--gold-dim)' : 'transparent',
                      borderColor:  step >= s.num ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
                      color:        step === s.num ? '#0a0a0a' : step > s.num ? 'var(--gold)' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span
                    className="text-[10px] tracking-widest uppercase"
                    style={{ color: step >= s.num ? 'var(--gold)' : 'rgba(255,255,255,0.3)' }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-16 h-px mx-2 mb-5 transition-all duration-700"
                    style={{ background: step > s.num ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pb-24">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit" transition={transition}>
              <Step1Service
                booking={booking}
                onSelect={(svc) => { update('service', svc); goNext() }}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit" transition={transition}>
              <Step2Staff
                booking={booking}
                onSelect={(staff) => { update('staff', staff); goNext() }}
                onBack={goBack}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit" transition={transition}>
              <Step3DateTime
                booking={booking}
                onSelect={(date, slot) => { update('date', date); update('slot', slot); goNext() }}
                onBack={goBack}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit" transition={transition}>
              <Step4Review
                booking={booking}
                update={update}
                onConfirm={(appt) => { update('appointment', appt); update('usedPackage', Boolean(appt?.package_used)); goNext() }}
                onBack={goBack}
              />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit" transition={transition}>
              <Step5Success booking={booking} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
