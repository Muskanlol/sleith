import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFetch } from '../../lib/useFetch'
import { academyApi } from '../../api/academy.api'
import { useAuth } from '../../context/AuthContext'
import { Reveal } from '../../components/common/Reveal'

const schema = z.object({
  schedule:   z.string().min(1, 'Please select a schedule preference'),
  timing:     z.string().min(1, 'Please select a timing preference'),
  motivation: z.string().min(10, 'Please share a bit about your motivation (min 10 characters)').max(600, 'Max 600 characters'),
  extra:      z.string().max(300, 'Max 300 characters').optional(),
})

function AuthGuard({ courseId }) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
      style={{ background: 'linear-gradient(180deg, #0E0409 0%, #140610 100%)' }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)' }}
      >
        <span className="text-xl" style={{ color: '#c9a96e' }}>✦</span>
      </div>
      <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
        Sign in to Apply
      </h2>
      <p className="max-w-xs text-sm text-white/45">
        You need an account to submit an application. It only takes a moment.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to={`/register?next=/academy/${courseId}/apply`}
          className="inline-flex items-center rounded-full px-7 py-3 text-sm font-semibold tracking-wide"
          style={{ background: 'linear-gradient(135deg,#c9a96e,#dbb87a)', color: '#0a0a0a' }}
        >
          Create Account
        </Link>
        <Link
          to={`/login?next=/academy/${courseId}/apply`}
          className="text-sm font-medium text-white/50 transition-colors hover:text-white/80"
        >
          Already a member? Log in →
        </Link>
      </div>
    </div>
  )
}

function OptionBtn({ label, value, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
      style={selected ? {
        background: 'rgba(196,24,80,0.18)',
        borderColor: 'rgba(196,24,80,0.55)',
        color: '#E8557A',
      } : {
        background: 'rgba(22,6,16,0.6)',
        borderColor: 'rgba(196,24,80,0.15)',
        color: 'rgba(255,255,255,0.45)',
      }}
    >
      {label}
    </button>
  )
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium tracking-wide text-white/50 mb-2">{label}</label>
      {hint && <p className="text-[11px] text-white/30 mb-2">{hint}</p>}
      {children}
      {error && <p className="text-xs mt-1.5" style={{ color: '#E8557A' }}>{error}</p>}
    </div>
  )
}

export default function ApplyForm() {
  const { id: courseId } = useParams()
  const navigate         = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [submitted,   setSubmitted]   = useState(false)
  const [serverError, setServerError] = useState(null)

  const [schedule, setSchedule] = useState('')
  const [timing,   setTiming]   = useState('')

  const { data: course } = useFetch(() => academyApi.getCourse(courseId), [courseId])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { schedule: '', timing: '', motivation: '', extra: '' },
  })

  const pickSchedule = (val) => { setSchedule(val); setValue('schedule', val, { shouldValidate: true }) }
  const pickTiming   = (val) => { setTiming(val);   setValue('timing',   val, { shouldValidate: true }) }

  if (!isAuthenticated) return <AuthGuard courseId={courseId} />

  const onSubmit = async (values) => {
    try {
      setServerError(null)

      const notes = [
        `Schedule preference: ${values.schedule}`,
        `Timing preference: ${values.timing}`,
        `Motivation: ${values.motivation}`,
        values.extra ? `Additional notes: ${values.extra}` : '',
      ].filter(Boolean).join('\n')

      await academyApi.apply({
        course: Number(courseId),
        notes,
      })
      setSubmitted(true)
    } catch (err) {
      const data = err?.response?.data
      setServerError(
        data?.detail ||
        data?.non_field_errors?.[0] ||
        data?.course?.[0] ||
        'Something went wrong. Please try again.'
      )
    }
  }

  if (submitted) {
    return (
      <div
        className="flex min-h-[70vh] flex-col items-center justify-center gap-7 px-4 text-center"
        style={{ background: 'linear-gradient(180deg, #0E0409 0%, #140610 100%)' }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'rgba(26,110,53,0.2)', border: '1px solid rgba(26,110,53,0.4)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Application Submitted!
          </h2>
          <p className="max-w-sm text-sm text-white/45">
            We've received your application for{' '}
            <strong className="text-white/70">{course?.name}</strong>.{' '}
            Our academy team will review your preferences and reach out within <strong className="text-white/70">48 hours</strong>.
          </p>
        </div>
        <div
          className="rounded-2xl px-6 py-4 max-w-sm text-left"
          style={{ background: 'rgba(22,6,16,0.8)', border: '1px solid rgba(201,169,110,0.15)' }}
        >
          <p className="text-[10px] tracking-widest uppercase mb-2 text-white/30">What happens next?</p>
          <ul className="space-y-1.5 text-xs text-white/45">
            <li>✦ We review your application &amp; schedule preference</li>
            <li>✦ We assign you to a matching batch — or inform you of the wait</li>
            <li>✦ You'll receive confirmation with payment details</li>
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/account/applications"
            className="inline-flex items-center rounded-full px-7 py-3 text-sm font-semibold tracking-wide"
            style={{ background: 'linear-gradient(135deg,#c9a96e,#dbb87a)', color: '#0a0a0a' }}
          >
            Track My Application →
          </Link>
          <Link to="/academy" className="text-sm font-medium text-white/40 hover:text-white/65 transition-colors">
            Browse More Courses
          </Link>
        </div>
      </div>
    )
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/25 outline-none transition-colors
    focus:ring-1 resize-none`
  const inputStyle = {
    background: 'rgba(20,6,16,0.9)',
    border: '1px solid rgba(196,24,80,0.2)',
    '--tw-ring-color': '#C9A96E',
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, #0E0409 0%, #140610 100%)', minHeight: '80vh' }}>
      <div className="mx-auto max-w-xl px-4 py-16">
        <Reveal>
          <div className="mb-8 flex items-center gap-2 text-xs text-white/35">
            <Link to="/academy" className="hover:text-white/60 transition-colors">Academy</Link>
            <span>›</span>
            {course && (
              <>
                <Link to={`/academy/${courseId}`} className="hover:text-white/60 transition-colors">{course.name}</Link>
                <span>›</span>
              </>
            )}
            <span className="text-white/55">Apply</span>
          </div>

          <div className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8" style={{ background: 'rgba(196,24,80,0.5)' }} />
              <p className="text-[10px] font-medium uppercase tracking-[0.4em]"
                style={{ color: 'rgba(196,24,80,0.75)' }}>Application Form</p>
            </div>
            <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {course ? `Apply for ${course.name}` : 'Course Application'}
            </h1>
            <p className="mt-2 text-sm text-white/40">
              Applying as <strong className="text-white/65">{user?.full_name || user?.email}</strong>
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">

            <Field
              label="Schedule Preference *"
              hint="When are you generally available for classes?"
              error={errors.schedule?.message}
            >
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '📅 Weekdays', value: 'Weekdays' },
                  { label: '🗓️ Weekends', value: 'Weekends' },
                  { label: '🔀 Either works', value: 'Flexible' },
                ].map((opt) => (
                  <OptionBtn key={opt.value} {...opt} selected={schedule === opt.value} onClick={pickSchedule} />
                ))}
              </div>
            </Field>

            <Field
              label="Preferred Timing *"
              hint="What time of day works best for you?"
              error={errors.timing?.message}
            >
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🌅 Morning (9 AM – 12 PM)', value: 'Morning' },
                  { label: '☀️ Afternoon (12 – 4 PM)',  value: 'Afternoon' },
                  { label: '🌆 Evening (4 – 8 PM)',      value: 'Evening' },
                  { label: '🕐 Flexible',                value: 'Flexible' },
                ].map((opt) => (
                  <OptionBtn key={opt.value} {...opt} selected={timing === opt.value} onClick={pickTiming} />
                ))}
              </div>
            </Field>

            <Field
              label="Why do you want to join this course? *"
              error={errors.motivation?.message}
            >
              <textarea
                {...register('motivation')}
                rows={4}
                placeholder="Tell us about your background, why you're interested in this course, and what you hope to achieve…"
                className={inputClass}
                style={{ ...inputStyle, borderColor: errors.motivation ? '#E8557A' : 'rgba(196,24,80,0.2)' }}
              />
              <p className="text-[11px] text-white/25 mt-1">Min 10 characters · max 600</p>
            </Field>

            <Field
              label="Anything else we should know? (optional)"
              error={errors.extra?.message}
            >
              <textarea
                {...register('extra')}
                rows={2}
                placeholder="Any specific requirements, questions, or notes for our team…"
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <div
              className="rounded-xl px-5 py-4 text-xs text-white/40 leading-relaxed"
              style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.12)' }}
            >
              <strong className="text-white/60">What happens after you apply?</strong><br />
              Our team reviews your application and matches you to an available batch based on your preferences.
              If no batch is currently open, we'll reach out with options — including a substitute batch or a start date for the next one.
            </div>

            {serverError && (
              <p className="rounded-xl px-5 py-4 text-sm"
                style={{ background: 'rgba(185,28,28,0.15)', border: '1px solid rgba(185,28,28,0.3)', color: '#fca5a5' }}>
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full py-3.5 text-sm font-semibold tracking-wide disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #C41850, #9b2563)', color: '#fff' }}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Application'}
            </button>

            <p className="text-center text-xs text-white/25">
              By applying, you agree that SLEITH Academy may contact you regarding your application.
            </p>
          </form>
        </Reveal>
      </div>
    </div>
  )
}
