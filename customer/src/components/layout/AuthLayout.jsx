import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-14 bg-auth-bg overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 110%, rgba(201,169,110,0.07) 0%, #0B0907 65%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-40"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 text-center z-10"
      >
        <Link to="/" className="group inline-block focus:outline-none">
          <h1
            className="font-display text-4xl font-semibold tracking-[0.28em] text-gold uppercase"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.28em' }}
          >
            SLEITH
          </h1>
          <p className="mt-1 text-[10px] font-medium tracking-[0.4em] text-auth-muted uppercase">
            Salon &amp; Academy
          </p>
        </Link>

        <div className="mt-5 flex items-center justify-center gap-3">
          <div
            className="h-px w-14"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.45))',
            }}
          />
          <div className="h-1 w-1 rotate-45 bg-gold/55 rounded-none" />
          <div
            className="h-px w-14"
            style={{
              background: 'linear-gradient(to left, transparent, rgba(201,169,110,0.45))',
            }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
      >
        {title && (
          <div className="mb-6 text-center">
            <h2
              className="font-display text-2xl font-semibold text-auth-text"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-auth-muted">{subtitle}</p>
            )}
          </div>
        )}

        <div
          className="rounded-xl px-8 py-9 shadow-2xl"
          style={{
            background: '#161210',
            border: '1px solid rgba(201,169,110,0.22)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,169,110,0.08)',
          }}
        >
          {children}
        </div>
      </motion.div>

      <p className="relative z-10 mt-10 text-[11px] tracking-wider text-auth-muted/60 uppercase">
        © {new Date().getFullYear()} SLEITH. All rights reserved.
      </p>
    </div>
  )
}
