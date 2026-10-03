import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHero from '../components/common/SectionHero'
import { Reveal, StaggerReveal } from '../components/common/Reveal'
import api from '../api/client'

const INFO = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    label: 'Visit Us',
    value: '12, Luxury Lane, Sector 18\nNoida, Uttar Pradesh — 201301',
    sub: 'Mon – Sat: 10 AM – 8 PM',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    label: 'Call Us',
    value: '+91 98765 43210',
    sub: 'Available during working hours',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    label: 'Email Us',
    value: 'hello@sleith.in',
    sub: 'We reply within 24 hours',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Working Hours',
    value: 'Mon – Sat: 10 AM – 8 PM',
    sub: 'Sunday: 11 AM – 6 PM',
  },
]

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function Contact() {
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors,  setErrors]  = useState({})
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [apiErr,  setApiErr]  = useState(null)

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((er) => ({ ...er, [e.target.name]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())     e.name    = 'Name is required'
    if (!form.email.trim())    e.email   = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.subject.trim())  e.subject = 'Subject is required'
    if (!form.message.trim())  e.message = 'Message is required'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSending(true)
    setApiErr(null)
    try {
      await api.post('/contact/', form)
      setSent(true)
    } catch {
      setApiErr('Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200
    border focus:border-gold/60 focus:ring-1 focus:ring-gold/20`

  const inputStyle = {
    background: 'var(--hover-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-primary)',
  }

  return (
    <div style={{ background: 'var(--page-bg)' }}>
      <SectionHero
        eyebrow="GET IN TOUCH"
        title={<>We'd love to <span style={{ color: 'var(--gold)' }}>hear from you</span></>}
        subtitle="Questions about our services, courses, or anything else — reach out and we'll get back to you promptly."
        variant="gold"
      />

      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid lg:grid-cols-5 gap-14">
          <div className="lg:col-span-2 space-y-4">
            <Reveal>
              <div>
                <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--gold)' }}>
                  Reach us
                </p>
                <h2 className="text-3xl font-semibold mb-6"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
                  Contact Information
                </h2>
              </div>
            </Reveal>

            <StaggerReveal className="space-y-4">
              {INFO.map((info) => (
                <div
                  key={info.label}
                  className="flex items-start gap-4 p-5 rounded-2xl border transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <span className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }}>
                    {info.icon}
                  </span>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {info.label}
                    </p>
                    <p className="text-sm font-medium whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                      {info.value}
                    </p>
                    {info.sub && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{info.sub}</p>
                    )}
                  </div>
                </div>
              ))}
            </StaggerReveal>

            <Reveal delay={0.2}>
              <div className="pt-4">
                <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Follow SLEITH
                </p>
                <div className="flex gap-3">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.name}
                      className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:border-gold/60 hover:text-gold"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.25}>
              <div
                className="mt-4 rounded-2xl p-6"
                style={{
                  background: 'linear-gradient(135deg, #0d0b07, #1a1408)',
                  border: '1px solid rgba(201,169,110,0.2)',
                }}
              >
                <p className="text-white/40 text-xs tracking-widest uppercase mb-2">Ready to visit?</p>
                <p className="text-white font-semibold text-base mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Skip the wait — book online in minutes
                </p>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#c9a96e,#dbb87a)', color: '#0a0a0a' }}
                >
                  Book Now →
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-3">
            <Reveal>
              <div
                className="rounded-3xl p-8 md:p-10 border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 text-center"
                  >
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
                      style={{ background: 'linear-gradient(135deg,#c9a96e,#dbb87a)' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth={2.5} className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold mb-2"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
                      Message Sent!
                    </h3>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                      className="text-xs tracking-widest uppercase font-medium"
                      style={{ color: 'var(--gold)' }}
                    >
                      Send another message →
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={submit} noValidate className="space-y-5">
                    <div>
                      <p className="text-xs tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>
                        Send a message
                      </p>
                      <h2 className="text-2xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
                        We'll be in touch
                      </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Full Name" error={errors.name}>
                        <input
                          name="name" value={form.name} onChange={handle}
                          placeholder="Your name"
                          className={inputClass}
                          style={{ ...inputStyle, borderColor: errors.name ? '#b91c1c' : 'var(--card-border)' }}
                        />
                      </Field>
                      <Field label="Email Address" error={errors.email}>
                        <input
                          type="email" name="email" value={form.email} onChange={handle}
                          placeholder="you@email.com"
                          className={inputClass}
                          style={{ ...inputStyle, borderColor: errors.email ? '#b91c1c' : 'var(--card-border)' }}
                        />
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Phone (optional)" error={errors.phone}>
                        <input
                          type="tel" name="phone" value={form.phone} onChange={handle}
                          placeholder="+91 98765 43210"
                          className={inputClass}
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Subject" error={errors.subject}>
                        <select
                          name="subject" value={form.subject} onChange={handle}
                          className={inputClass}
                          style={{ ...inputStyle, borderColor: errors.subject ? '#b91c1c' : 'var(--card-border)' }}
                        >
                          <option value="">Select a topic</option>
                          <option value="Salon Inquiry">Salon Inquiry</option>
                          <option value="Academy Inquiry">Academy Inquiry</option>
                          <option value="Booking Help">Booking Help</option>
                          <option value="Feedback">Feedback</option>
                          <option value="Other">Other</option>
                        </select>
                      </Field>
                    </div>

                    <Field label="Your Message" error={errors.message}>
                      <textarea
                        name="message" value={form.message} onChange={handle}
                        placeholder="Tell us how we can help…"
                        rows={5}
                        className={inputClass}
                        style={{ ...inputStyle, resize: 'vertical', borderColor: errors.message ? '#b91c1c' : 'var(--card-border)' }}
                      />
                    </Field>

                    {apiErr && <p className="text-red-500 text-sm">{apiErr}</p>}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-3.5 rounded-full text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-60 hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#c9a96e,#dbb87a)', color: '#0a0a0a' }}
                    >
                      {sending ? 'Sending…' : 'Send Message →'}
                    </button>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="mx-4 md:mx-auto max-w-6xl mb-20 rounded-3xl overflow-hidden border"
          style={{ borderColor: 'var(--card-border)', height: '320px', position: 'relative' }}>
          <iframe
            title="SLEITH Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.7!2d77.3132!3d28.5706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDM0JzE0LjIiTiA3N8KwMTgnNDcuNSJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(0.3) contrast(1.05)' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Reveal>
    </div>
  )
}
