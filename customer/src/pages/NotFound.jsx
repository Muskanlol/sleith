import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'

export default function NotFound() {
  const numRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!numRef.current) return
    gsap.fromTo(
      numRef.current,
      { opacity: 0, scale: 0.85, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power4.out' }
    )
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #0e0b07 50%, #0a0a0a 100%)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,169,110,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-lg">
        <div
          ref={numRef}
          className="text-[10rem] md:text-[14rem] font-bold leading-none select-none mb-0"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            background: 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.06))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.05em',
          }}
        >
          404
        </div>

        <div className="flex items-center gap-3 mb-8 -mt-4">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.3))' }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(201,169,110,0.5)' }}>
            Page not found
          </span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(201,169,110,0.3), transparent)' }} />
        </div>

        <h1
          className="text-2xl md:text-3xl font-semibold text-white mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          This page doesn't exist
        </h1>
        <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.35)' }}>
          The page you're looking for may have moved or the link might be incorrect.
          Let us take you somewhere beautiful instead.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full text-sm font-medium border transition-all hover:border-white/30"
            style={{ color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            ← Go Back
          </button>
          <Link
            to="/"
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#c9a96e,#dbb87a)', color: '#0a0a0a' }}
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-12 flex justify-center gap-6 flex-wrap">
          {[
            { to: '/services', label: 'Services' },
            { to: '/book',     label: 'Book Now' },
            { to: '/academy',  label: 'Academy' },
            { to: '/gallery',  label: 'Gallery' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-xs tracking-widest uppercase transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--gold)')}
              onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.25)')}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
