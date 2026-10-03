import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'

const HERO_PLAYLIST = [
  'https://assets.mixkit.co/videos/40540/40540-720.mp4',
  'https://assets.mixkit.co/videos/49556/49556-720.mp4',
  'https://assets.mixkit.co/videos/23596/23596-720.mp4',
  'https://assets.mixkit.co/videos/13088/13088-720.mp4',
]

const HERO_STILLS = [
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1920&q=80',
]

const TICKER = ['Hair Artistry', 'Skin Rituals', 'Makeup', 'Nail Studio', 'Academy']

function Star({ className = '' }) {
  return (
    <span
      className={`select-none font-display ${className}`}
      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
    >
      ✦
    </span>
  )
}

export default function HomeHero() {
  const [videoReady, setVideoReady] = useState(false)
  const [clipIndex, setClipIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const subtextRef = useRef(null)
  const ctasRef = useRef(null)
  const goldLineRef = useRef(null)
  const videoRef = useRef(null)
  const failedClips = useRef(new Set())

  const goToNextClip = () => {
    setClipIndex((current) => {
      for (let step = 1; step <= HERO_PLAYLIST.length; step += 1) {
        const next = (current + step) % HERO_PLAYLIST.length
        if (!failedClips.current.has(next)) return next
      }
      return current
    })
  }

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduceMotion) return
    const play = () => {
      video.play().catch(() => {})
    }
    play()
  }, [clipIndex, reduceMotion])

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(goldLineRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.9, transformOrigin: 'left center' }
      )
      .fromTo(eyebrowRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.5'
      )
      .fromTo(headingRef.current,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.85 },
        '-=0.45'
      )
      .fromTo(subtextRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.55'
      )
      .fromTo(ctasRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.65 },
        '-=0.45'
      )

    return () => { tl.kill() }
  }, [])

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden px-4 pb-16 pt-28 md:pt-24">
      <div className="absolute inset-0 bg-[#0B0907]" aria-hidden="true">
        <div className="hero-still-stack absolute inset-0">
          {HERO_STILLS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`hero-still hero-still-${i + 1} absolute inset-0 h-full w-full object-cover`}
            />
          ))}
        </div>

        {!reduceMotion && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{
              opacity: videoReady ? 1 : 0,
              filter: 'saturate(0.72) contrast(1.08) brightness(0.78)',
            }}
            muted
            playsInline
            autoPlay
            preload="auto"
            poster={HERO_STILLS[clipIndex % HERO_STILLS.length]}
            src={HERO_PLAYLIST[clipIndex]}
            onPlaying={() => setVideoReady(true)}
            onEnded={goToNextClip}
            onError={() => {
              failedClips.current.add(clipIndex)
              if (failedClips.current.size >= HERO_PLAYLIST.length) {
                setVideoReady(false)
                return
              }
              goToNextClip()
            }}
          />
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,9,7,0.72) 0%, rgba(11,9,7,0.42) 42%, rgba(11,9,7,0.78) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(201,169,110,0.18) 0%, transparent 58%)',
        }}
      />
      <div className="hero-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="select-none whitespace-nowrap text-[22vw] font-semibold leading-none text-gold opacity-[0.045]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          SLEITH
        </span>
      </div>

      <div className="pointer-events-none absolute left-6 top-10 hidden h-16 w-16 border-l border-t border-gold/25 md:block" />
      <div className="pointer-events-none absolute right-6 top-10 hidden h-16 w-16 border-r border-t border-gold/25 md:block" />
      <div className="pointer-events-none absolute bottom-16 left-6 hidden h-16 w-16 border-b border-l border-gold/25 md:block" />
      <div className="pointer-events-none absolute bottom-16 right-6 hidden h-16 w-16 border-b border-r border-gold/25 md:block" />

      <div className="relative mx-auto w-full max-w-3xl text-center">
        <div ref={eyebrowRef} className="mb-5 flex items-center justify-center gap-3" style={{ opacity: 0 }}>
          <span ref={goldLineRef} className="block h-px w-8 origin-left bg-gold/40" style={{ opacity: 0 }} />
          <p className="text-[10px] font-medium tracking-[0.45em] text-gold/80 uppercase">
            Luxury Beauty &amp; Education
          </p>
          <span className="h-px w-8 bg-gold/40" />
        </div>

        <h1
          ref={headingRef}
          className="mb-6 text-5xl font-semibold leading-[1.08] text-white drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)] md:text-[4.75rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", opacity: 0 }}
        >
          Where Beauty
          <br />
          <em className="not-italic text-gold">Meets Craft</em>
        </h1>

        <p
          ref={subtextRef}
          className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-white/60"
          style={{ opacity: 0 }}
        >
          Book premium salon services, discover curated packages, or begin your
          professional journey at the SLEITH Academy.
        </p>

        <div
          ref={ctasRef}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ opacity: 0 }}
        >
          <Link
            to="/book"
            className="btn-gold-shimmer inline-flex items-center justify-center gap-2 rounded-md px-8 py-3.5 text-sm font-semibold tracking-wide shadow-xl"
          >
            <Star className="text-xs text-black/60" />
            Book an Appointment
          </Link>
          <Link
            to="/academy"
            className="inline-flex items-center justify-center rounded-md border bg-black/20 px-8 py-3.5 text-sm font-medium text-white/75 backdrop-blur-sm transition-colors duration-200 hover:border-gold/50 hover:text-white"
            style={{ borderColor: 'rgba(201,169,110,0.35)' }}
          >
            Explore Academy
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden border-t border-gold/15 bg-black/25 py-3 backdrop-blur-sm">
        <div className="hero-marquee flex whitespace-nowrap text-[10px] font-medium tracking-[0.35em] text-gold/55 uppercase">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0 items-center">
              {TICKER.map((item) => (
                <span key={`${copy}-${item}`} className="mx-5 flex items-center gap-5">
                  {item}
                  <span className="text-gold/35">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
