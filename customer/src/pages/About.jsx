import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Reveal, StaggerReveal } from '../components/common/Reveal'
import SectionHero from '../components/common/SectionHero'

gsap.registerPlugin(ScrollTrigger)

const VALUES = [
  {
    icon: '✦',
    title: 'Crafted with Intent',
    desc: 'Every service is designed around your uniqueness — not a template, not a rush. We take the time to understand before we begin.',
  },
  {
    icon: '◈',
    title: 'Rooted in Education',
    desc: 'Great beauty begins with knowledge. Our academy trains the next generation of artists with international curriculum and hands-on mastery.',
  },
  {
    icon: '◆',
    title: 'Luxury, Accessible',
    desc: 'Premium does not have to mean distant. SLEITH brings editorial-grade experiences to everyday moments.',
  },
  {
    icon: '⬡',
    title: 'Community First',
    desc: 'From first-time clients to career-making students, we nurture a space where everyone belongs and grows.',
  },
]

const MILESTONES = [
  { year: '2019', label: 'Salon Founded', desc: 'SLEITH opened its first chair — built on craft, care, and elevated aesthetics.' },
  { year: '2021', label: 'Academy Launched', desc: 'Our beauty academy welcomed its first cohort, turning passion into profession.' },
  { year: '2023', label: 'Digital Expansion', desc: 'Seamless online booking and digital client experiences rolled out nationally.' },
  { year: '2024', label: 'Gallery & Packages', desc: "Curated service bundles and a live gallery brought SLEITH's artistry online." },
]

const STATS = [
  { value: '2,500+', label: 'Happy Clients' },
  { value: '150+',   label: 'Academy Graduates' },
  { value: '30+',    label: 'Expert Services' },
  { value: '5★',     label: 'Average Rating' },
]

function GoldDivider() {
  return (
    <div className="flex items-center gap-4 my-2">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--gold) 60%)' }} />
      <span style={{ color: 'var(--gold)', fontSize: '10px' }}>✦</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, var(--gold) 40%, transparent)' }} />
    </div>
  )
}

export default function About() {
  const heroTextRef = useRef(null)

  useEffect(() => {
    if (!heroTextRef.current) return
    const els = heroTextRef.current.querySelectorAll('[data-hero]')
    gsap.fromTo(els,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: 'power3.out', delay: 0.2 }
    )
  }, [])

  return (
    <div style={{ background: 'var(--page-bg)' }}>
      <SectionHero
        eyebrow="OUR STORY"
        title={<>Where Art Meets <span style={{ color: 'var(--gold)' }}>Purpose</span></>}
        subtitle="SLEITH was born from a belief that great beauty is both an experience and an education."
        variant="gold"
      />

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--gold)' }}>
                The SLEITH Philosophy
              </p>
              <h2 className="text-4xl font-semibold leading-snug mb-6"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
                Two worlds.<br />One vision.
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  SLEITH is more than a salon. It is a destination built on the conviction that beauty deserves
                  intention — the right technique, the right environment, and the right people.
                </p>
                <p>
                  Alongside our salon, the <span style={{ color: 'var(--gold)', fontWeight: 600 }}>SLEITH Academy</span> was
                  created so this philosophy could be taught, not just practised. Every graduate carries the same
                  commitment to craft that defines every service we offer.
                </p>
              </div>
              <div className="mt-8 flex gap-4 flex-wrap">
                <Link to="/services"
                  className="px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all hover:opacity-90"
                  style={{ background: 'var(--gold)', color: '#0a0a0a' }}>
                  Explore Services
                </Link>
                <Link to="/academy"
                  className="px-6 py-2.5 rounded-full text-sm font-medium tracking-wide border transition-all hover:border-gold"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                  View Academy →
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative">
              <div
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0d0b07 0%, #161209 100%)',
                  border: '1px solid rgba(201,169,110,0.25)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,169,110,0.1) 0%, transparent 70%)' }} />

                <p className="text-xs tracking-[0.25em] uppercase mb-5" style={{ color: 'rgba(201,169,110,0.6)' }}>
                  Our Promise
                </p>
                <blockquote
                  className="text-2xl font-semibold leading-snug mb-6 text-white"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  "Every visit should feel like the first — and the best."
                </blockquote>
                <GoldDivider />
                <p className="text-sm mt-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  — The SLEITH Founding Team
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="py-16"
        style={{ background: 'linear-gradient(135deg, #0d0b07 0%, #120f08 50%, #0d0b07 100%)' }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center py-6">
                <p
                  className="text-4xl font-bold mb-1"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    background: 'linear-gradient(135deg, #c9a96e, #dbb87a)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {s.value}
                </p>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-24">
        <Reveal>
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--gold)' }}>
              Our Journey
            </p>
            <h2 className="text-4xl font-semibold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
              Built over years,<br />refined every day
            </h2>
          </div>
        </Reveal>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--gold) 20%, var(--gold) 80%, transparent)' }} />

          <div className="space-y-12">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.year} delay={i * 0.08}>
                <div className={`flex items-start gap-8 md:gap-16 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <span
                      className="text-5xl font-bold"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        color: 'var(--gold)',
                        opacity: 0.25,
                      }}
                    >
                      {m.year}
                    </span>
                  </div>

                  <div className="relative hidden md:flex flex-col items-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full mt-2" style={{ background: 'var(--gold)' }} />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--gold)' }}>
                      {m.year}
                    </p>
                    <h3 className="text-xl font-semibold mb-2"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
                      {m.label}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {m.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--hover-bg)' }} className="py-24">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--gold)' }}>
                What We Stand For
              </p>
              <h2 className="text-4xl font-semibold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
                Our Values
              </h2>
            </div>
          </Reveal>

          <StaggerReveal className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="p-7 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <span className="text-2xl mb-4 block" style={{ color: 'var(--gold)' }}>{v.icon}</span>
                <h3 className="text-lg font-semibold mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-24">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--gold)' }}>
              The SLEITH Experience
            </p>
            <h2 className="text-4xl font-semibold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
              Two paths, one destination
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          <Reveal delay={0}>
            <div
              className="rounded-3xl p-10 h-full flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #0d0b07 0%, #1a1408 100%)',
                border: '1px solid rgba(201,169,110,0.2)',
              }}
            >
              <div>
                <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: 'rgba(201,169,110,0.6)' }}>
                  Salon
                </p>
                <h3 className="text-3xl font-semibold text-white mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  An experience crafted for you
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Hair, skin, nails, makeup — delivered by artists who lead with intention. Every appointment
                  is a private ritual, tailored entirely to you.
                </p>
              </div>
              <Link to="/services"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-wide"
                style={{ color: 'var(--gold)' }}>
                Browse Services →
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div
              className="rounded-3xl p-10 h-full flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #110a0f 0%, #1a0f16 100%)',
                border: '1px solid rgba(155,90,110,0.25)',
              }}
            >
              <div>
                <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: 'rgba(155,90,110,0.7)' }}>
                  Academy
                </p>
                <h3 className="text-3xl font-semibold text-white mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Turn passion into profession
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Structured courses, industry mentors, and real-world practise. If you want a career in beauty,
                  SLEITH Academy is where it begins.
                </p>
              </div>
              <Link to="/academy"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-wide"
                style={{ color: '#c97b90' }}>
                Explore Courses →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="py-24 text-center"
        style={{ background: 'linear-gradient(135deg, #0d0b07 0%, #0a0805 100%)' }}
      >
        <Reveal>
          <div className="max-w-xl mx-auto px-4">
            <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: 'rgba(201,169,110,0.5)' }}>
              Ready?
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Your first appointment awaits
            </h2>
            <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Book online in minutes. No calls, no waiting — just exceptional service when you want it.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/book"
                className="px-8 py-3.5 rounded-full text-sm font-semibold tracking-widest uppercase transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#c9a96e,#dbb87a)', color: '#0a0a0a' }}>
                Book Now
              </Link>
              <Link to="/staff"
                className="px-8 py-3.5 rounded-full text-sm font-medium tracking-widest uppercase border transition-all"
                style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)' }}>
                Meet Our Team
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
