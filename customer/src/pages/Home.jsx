import { Link } from 'react-router-dom'
import { Reveal, StaggerReveal } from '../components/common/Reveal'
import { useFetch } from '../lib/useFetch'
import { asList } from '../lib/list'
import { salonApi } from '../api/salon.api'
import { academyApi } from '../api/academy.api'
import ReviewCard from '../components/common/ReviewCard'
import HomeHero from '../components/home/HomeHero'

const SERVICES = [
  {
    number: '01', label: 'Hair',  tagline: 'Artistry & Color',
    desc: 'Precision cuts, vivid color, keratin treatments and scalp rituals.',
    img1: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
  },
  {
    number: '02', label: 'Skin',  tagline: 'Glow & Radiance',
    desc: 'Signature facials, chemical peels, LED therapy and hydration rituals.',
    img1: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80',
  },
  {
    number: '03', label: 'Makeup', tagline: 'Artistry & Finish',
    desc: 'Bridal, party and editorial looks crafted for every occasion.',
    img1: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
  },
  {
    number: '04', label: 'Nail', tagline: 'Art & Lacquer',
    desc: 'Gel, acrylic, nail art and luxury manicure & pedicure experiences.',
    img1: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1604655853571-82a02c96c5e1?w=600&q=80',
  },
  {
    number: '05', label: 'Body',  tagline: 'Ritual & Restore',
    desc: 'De-stress massages, body wraps and reviving beauty rituals.',
    img1: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
  },
]

const PROGRAMS = [
  {
    number: '01', title: 'Hair Artistry', duration: '3 months', level: 'Foundation to Advanced', slug: null,
    desc: 'Master cutting techniques, color science and salon operations.',
    img1: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80',
  },
  {
    number: '02', title: 'Skin & Aesthetics', duration: '4 months', level: 'Beginner to Professional', slug: null,
    desc: 'Facial anatomy, treatment protocols and clinical skin practice.',
    img1: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  },
  {
    number: '03', title: 'Nail Technician', duration: '2 months', level: 'All Levels Welcome', slug: null,
    desc: 'Gel systems, nail art, extension techniques and hygiene standards.',
    img1: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
    img2: 'https://images.unsplash.com/photo-1604655853571-82a02c96c5e1?w=600&q=80',
  },
]

function padNum(n) {
  return String(n).padStart(2, '0')
}

function pickFeaturedServices(services, count = 4) {
  const active = (services || []).filter((s) => s.is_active !== false)
  const slots = [
    { test: (s) => /hair/i.test(s.category_name || ''), prefer: /haircut/i },
    { test: (s) => /skin/i.test(s.category_name || ''), prefer: /glow|hydrat/i },
    { test: (s) => /makeup/i.test(`${s.category_name || ''} ${s.name || ''}`), prefer: /bridal|party/i },
    { test: (s) => /nail/i.test(s.category_name || ''), prefer: /manicure|art/i },
  ]

  const picked = []
  const used = new Set()

  for (const slot of slots) {
    const pool = active.filter((s) => slot.test(s) && !used.has(s.id))
    const choice = pool.find((s) => slot.prefer.test(s.name)) || pool[0]
    if (choice) {
      picked.push(choice)
      used.add(choice.id)
    }
  }

  for (const s of active) {
    if (picked.length >= count) break
    if (used.has(s.id)) continue
    if (/waxing|bikini/i.test(`${s.name} ${s.category_name || ''}`)) continue
    picked.push(s)
    used.add(s.id)
  }

  return picked.slice(0, count)
}

function cardImages(beforeUrl, afterUrl, fallback, index) {
  const v = fallback(index)
  const img1 = beforeUrl || afterUrl || v.img1
  const img2 = afterUrl || beforeUrl || v.img2
  return { img1, img2 }
}

function visualsForCategory(categoryName, index) {
  const key = (categoryName || '').toLowerCase()
  const match = SERVICES.find((s) => key.includes(s.label.toLowerCase()))
  return match || SERVICES[index % SERVICES.length]
}

function visualsForProgram(index) {
  return PROGRAMS[index % PROGRAMS.length]
}

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

export default function Home() {
  const { data: servicesData, loading: servicesLoading, error: servicesError } = useFetch(() => salonApi.getServices())
  const { data: coursesData,  loading: coursesLoading,  error: coursesError  } = useFetch(() => academyApi.getCourses())
  const { data: staffData }   = useFetch(() => salonApi.getStaff())
  const { data: reviewsData } = useFetch(() => salonApi.getPublicReviews())

  const liveServices = pickFeaturedServices(asList(servicesData), 4)
  const liveCourses  = asList(coursesData).filter((c) => c.is_active !== false).slice(0, 3)
  const liveStaff    = asList(staffData).filter((s) => s.is_active !== false)
  const liveReviews  = asList(reviewsData).slice(0, 6)

  const serviceCards = liveServices.length
    ? liveServices.map((s, i) => {
        const v = cardImages(
          s.image_url || s.category_image_before_url,
          s.category_image_after_url,
          (i) => visualsForCategory(s.category_name, i),
          i,
        )
        return {
          key: s.id,
          number: padNum(i + 1),
          label: s.name,
          tagline: s.category_name || 'Salon',
          desc: s.description || 'A signature SLEITH ritual, tailored to you.',
          img1: v.img1,
          img2: v.img2,
          to: `/services/${s.id}`,
          meta: [s.duration_minutes ? `${s.duration_minutes} min` : null, s.price ? `₹${Number(s.price).toLocaleString('en-IN')}` : null]
            .filter(Boolean)
            .join(' · '),
        }
      })
    : SERVICES.map((s) => ({ ...s, key: s.number, to: '/services', meta: s.tagline }))

  const programCards = liveCourses.length
    ? liveCourses.map((c, i) => {
        const v = cardImages(
          c.image_before_url,
          c.image_after_url,
          visualsForProgram,
          i,
        )
        return {
          key: c.id,
          number: padNum(i + 1),
          title: c.name,
          duration: c.duration_months ? `${c.duration_months} month${c.duration_months === 1 ? '' : 's'}` : 'Program',
          level: c.fee != null ? `₹${Number(c.fee).toLocaleString('en-IN')}` : 'Enquire',
          desc: c.description || 'Industry-led training with hands-on studio practice.',
          slug: String(c.id),
          img1: v.img1,
          img2: v.img2,
        }
      })
    : PROGRAMS.map((p) => ({ ...p, key: p.number }))

  return (
    <div>
      <HomeHero />

      <section
        className="relative overflow-hidden py-24 px-4"
        style={{ background: 'linear-gradient(160deg, #111009 0%, #1C1709 55%, #130E06 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,169,110,0.09) 0%, transparent 70%)' }}
        />
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden" aria-hidden="true">
          <span className="block select-none text-[20vw] font-semibold leading-none opacity-[0.028] text-gold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>SALON</span>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <Reveal className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[10px] font-medium tracking-[0.45em] text-gold/60 uppercase">Our Services</p>
              <h2 className="text-4xl font-semibold text-white md:text-5xl"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                The Salon<br />
                <span className="text-gold">Experience</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-gold/50 to-transparent" />
              <Link to="/services" className="text-sm font-medium tracking-wide text-gold/70 transition-colors hover:text-gold">
                All Services →
              </Link>
            </div>
          </Reveal>

          {servicesLoading && !servicesError ? (
            <HomeCardSkeleton count={4} cols="lg:grid-cols-4" />
          ) : (
            <StaggerReveal key={serviceCards.map((s) => s.key).join('-')} className="grid grid-cols-1 gap-px bg-gold/10 sm:grid-cols-2 lg:grid-cols-4">
              {serviceCards.map(({ key, ...s }) => <ServiceCard key={key} {...s} />)}
            </StaggerReveal>
          )}

          <Reveal delay={0.1} className="mt-12 flex flex-col items-center gap-4 border-t pt-10 sm:flex-row sm:justify-between"
                 style={{ borderColor: 'rgba(201,169,110,0.15)' }}>
            <p className="text-sm text-white/40 max-w-sm">
              Each service is tailored to you — from express sessions to full transformation rituals.
            </p>
            <Link to="/book"
                  className="btn-gold-shimmer inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm font-semibold tracking-wide whitespace-nowrap">
              Book Now
            </Link>
          </Reveal>
        </div>
      </section>

      <div className="h-20" style={{ background: 'linear-gradient(to bottom, #130E06 0%, #140610 100%)' }} />

      <section
        className="relative overflow-hidden py-24 px-4"
        style={{ background: 'linear-gradient(160deg, #140610 0%, #220A18 45%, #140610 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0"
             style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(180,20,65,0.12) 0%, transparent 68%)' }} />
        <div className="pointer-events-none absolute inset-0"
             style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 100%, rgba(201,169,110,0.07) 0%, transparent 65%)' }} />
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 overflow-hidden" aria-hidden="true">
          <span className="block select-none text-[18vw] font-semibold leading-none opacity-[0.03]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#C41850' }}>ACADEMY</span>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <Reveal className="mb-14 text-center">
            <p className="mb-3 text-[10px] font-medium tracking-[0.45em] uppercase" style={{ color: 'rgba(196,24,80,0.75)' }}>
              Professional Education
            </p>
            <h2 className="text-4xl font-semibold text-white md:text-5xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              The SLEITH{' '}
              <em className="not-italic" style={{
                background: 'linear-gradient(90deg, #C41850 0%, #C9A96E 60%, #E8557A 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Academy</em>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/45">
              Turn your passion into a profession. Our courses are designed by industry masters, certified for the real world.
            </p>
          </Reveal>

          {coursesLoading && !coursesError ? (
            <HomeCardSkeleton count={3} cols="md:grid-cols-3" />
          ) : (
            <StaggerReveal key={programCards.map((p) => p.key).join('-')} className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {programCards.map(({ key, ...p }) => <ProgramCard key={key} {...p} />)}
            </StaggerReveal>
          )}

          <Reveal delay={0.1} className="mt-14 text-center">
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(196,24,80,0.5))' }} />
              <span className="text-xs tracking-[0.3em] text-white/30 uppercase">Apply now</span>
              <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(201,169,110,0.5))' }} />
            </div>
            <Link
              to="/academy"
              className="inline-flex items-center gap-3 rounded-md border px-9 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300"
              style={{ borderColor: 'rgba(196,24,80,0.4)', color: '#F5E8EC', background: 'rgba(196,24,80,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#C9A96E'; e.currentTarget.style.background='rgba(201,169,110,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,24,80,0.4)'; e.currentTarget.style.background='rgba(196,24,80,0.08)' }}
            >
              <Star className="text-[10px] text-gold" />
              Explore All Programs
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden" style={{ background: '#F5EDE0' }}>
        <div className="flex flex-col lg:flex-row min-h-[600px]">

          <div className="relative w-full lg:w-[48%] min-h-[480px] lg:min-h-[640px] overflow-hidden flex-shrink-0">
            <img
              src="/images/founder.jpg"
              alt="Founder of SLEITH"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 65%' }}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 hidden lg:block"
              style={{ background: 'linear-gradient(to right, transparent, #F5EDE0)' }} />
            <div className="absolute bottom-8 left-8 z-10">
              <p className="text-white/90 font-semibold leading-[1.1] drop-shadow-lg"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                meet<br />
                <em className="not-italic" style={{ color: '#C9A96E' }}>the</em><br />
                founder
              </p>
            </div>
          </div>

          <Reveal delay={0.1} className="flex flex-col justify-center gap-7 px-8 py-16 lg:px-14 lg:py-20 w-full lg:w-[52%]">
            <div className="flex items-center gap-3">
              <span className="h-px w-8" style={{ background: '#C9A96E' }} />
              <p className="text-[10px] font-medium tracking-[0.45em] uppercase"
                style={{ color: '#9A7A4A' }}>From the Founder</p>
            </div>

            <blockquote>
              <p className="text-3xl font-semibold leading-[1.3] md:text-[2.2rem]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a1208' }}>
                "Beauty is not a{' '}
                <em className="not-italic" style={{ color: '#C9A96E' }}>privilege</em> —<br />
                it is a <em className="not-italic" style={{ color: '#C9A96E' }}>craft</em> worth mastering."
              </p>
            </blockquote>

            <p className="max-w-md text-sm leading-relaxed" style={{ color: '#6B5A3E' }}>
              SLEITH was born from a single belief — that every woman deserves to feel
              extraordinary, and every passionate individual deserves a world-class platform
              to learn, grow, and thrive. What started as a dream became a sanctuary for
              beauty and education.
            </p>

            <div className="flex items-center gap-4">
              <div className="h-px w-10" style={{ background: '#C9A96E55' }} />
              <Star className="text-[10px]" style={{ color: '#C9A96E88' }} />
              <div className="h-px flex-1" style={{ background: '#C9A96E22' }} />
            </div>

            <div>
              <p className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#9A7A4A' }}>
                Muskan
              </p>
              <p className="mt-1 text-[11px] tracking-[0.25em] uppercase" style={{ color: '#A08C6E' }}>
                Founder & Director, SLEITH
              </p>
            </div>

            <a href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#C9A96E' }}>
              Our full story →
            </a>
          </Reveal>

        </div>
      </section>

      <section className="px-6 py-20 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #B5145A 0%, #D4216E 50%, #C41850 100%)' }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />

        <Reveal className="relative mx-auto max-w-2xl flex flex-col items-center gap-7">
          <p className="text-[10px] font-semibold tracking-[0.45em] uppercase"
            style={{ color: 'rgba(255,255,255,0.65)' }}>
            A Note from Our Founder
          </p>

          <div className="h-px w-12" style={{ background: 'rgba(255,255,255,0.4)' }} />

          <p className="text-lg leading-[1.85] md:text-xl"
            style={{ color: 'rgba(255,255,255,0.92)', fontFamily: "'DM Sans', sans-serif" }}>
            My journey in beauty began with a simple question — why should luxury be out of reach?
            I built SLEITH to break that barrier. Every service we offer, every course we teach,
            carries one promise: that you will leave feeling seen, skilled, and extraordinary.
            This is not just a salon or an academy. It is a space where women rise.
          </p>

          <div className="mt-2 flex flex-col items-center gap-1">
            <p className="text-3xl" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#fff',
              fontStyle: 'italic',
              letterSpacing: '0.02em',
            }}>
              Xo, Muskan
            </p>
            <p className="text-[10px] tracking-[0.3em] uppercase mt-1"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              Founder &amp; Director, SLEITH
            </p>
          </div>
        </Reveal>
      </section>

      <div className="relative px-4 py-14" style={{ background: '#EFE3CC' }}>
        <Reveal>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-10 md:grid-cols-4">
            {[
              { value: '5+', label: 'Years of Excellence' },
              { value: liveServices.length ? `${asList(servicesData).length}+` : '—', label: 'Signature Services' },
              { value: liveStaff.length ? `${liveStaff.length}+` : '—', label: 'Master Artists' },
              { value: liveCourses.length ? `${asList(coursesData).length}+` : '—', label: 'Academy Courses' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-semibold md:text-5xl"
                   style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#C9A96E' }}>
                  {s.value}
                </p>
                <p className="mt-1.5 text-[10px] tracking-[0.25em] uppercase" style={{ color: '#9A7A4A' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <section className="bg-page-bg px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-12 flex items-center gap-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
            <h2 className="text-center text-3xl font-semibold text-text-primary md:text-4xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              The SLEITH Difference
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/30 to-transparent" />
          </Reveal>

          <StaggerReveal stagger={0.12} className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { number: '01', title: 'Master Artisans',  desc: 'Every service is performed by certified specialists trained in the latest techniques.' },
              { number: '02', title: 'Curated Rituals',  desc: 'We blend luxury products with personalised consultation to create your perfect ritual.' },
              { number: '03', title: 'Real Education',   desc: 'Academy graduates leave with hands-on skills, industry certification and job placement support.' },
            ].map((item) => (
              <div key={item.number} className="group">
                <p className="mb-2 text-xs font-medium tracking-[0.3em] text-gold/50">{item.number}</p>
                <div className="mb-3 h-px w-10 bg-gold/30 transition-all duration-300 group-hover:w-20 group-hover:bg-gold/60" />
                <h3 className="mb-2 text-lg font-semibold text-text-primary"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {liveReviews.length > 0 && (
        <section
          className="relative overflow-hidden px-4 py-20"
          style={{ background: 'linear-gradient(160deg, #111009 0%, #161210 50%, #0B0907 100%)' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,169,110,0.08) 0%, transparent 65%)' }}
          />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-[10px] font-medium tracking-[0.45em] text-gold/60 uppercase">Client Voices</p>
              <h2
                className="text-3xl font-semibold text-white md:text-4xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                What They <span className="text-gold">Say</span>
              </h2>
            </Reveal>

            <StaggerReveal key={liveReviews.map((r) => r.id).join('-')} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {liveReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}

      <section
        className="relative overflow-hidden px-4 py-20 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(201,169,110,0.08) 0%, #0B0907 60%)' }}
      >
        <div className="pointer-events-none absolute inset-0"
             style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }} />
        <Reveal className="relative mx-auto max-w-xl">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gold/35" />
            <Star className="text-base text-gold/50" />
            <span className="h-px w-8 bg-gold/35" />
          </div>
          <h2 className="mb-4 text-3xl font-semibold text-white md:text-4xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Begin Your Journey
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/45">
            Whether you are here for a single service or a full transformation, SLEITH is ready for you.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/book"
                  className="btn-gold-shimmer inline-flex items-center gap-2 rounded-md px-8 py-3.5 text-sm font-semibold tracking-wide shadow-lg">
              Book an Appointment
            </Link>
            <Link to="/login" className="text-sm font-medium text-white/50 transition-colors hover:text-white/80">
              Already a member? Log in →
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

function ServiceCard({ number, label, tagline, desc, img1, img2, to = '/services', meta }) {
  return (
    <Link to={to}
      className="group relative flex flex-col cursor-pointer overflow-hidden transition-all duration-300"
      style={{ background: 'rgba(26,20,8,0.95)', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>

      <div className="relative h-52 overflow-hidden flex-shrink-0">
        <img src={img1} alt={label}
          className="absolute inset-0 w-full h-full object-cover scale-100 transition-all duration-700 ease-in-out group-hover:opacity-0 group-hover:scale-105" />
        <img src={img2} alt={label}
          className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 transition-all duration-700 ease-in-out group-hover:opacity-100 group-hover:scale-100" />
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(26,20,8,1), transparent)' }} />
        <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-[0.3em] text-white/50">{number}</span>
      </div>

      <div className="flex flex-col gap-3 p-6 flex-1">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
             style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(201,169,110,0.06) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rotate-45 transition-colors duration-300"
                style={{ background: 'rgba(201,169,110,0.55)' }} />
          <h3 className="text-lg font-semibold text-white transition-colors duration-300 group-hover:text-gold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {label}
          </h3>
        </div>
        <p className="text-[10px] font-medium tracking-[0.22em] uppercase" style={{ color: 'rgba(201,169,110,0.5)' }}>{tagline}</p>
        {meta && meta !== tagline && (
          <p className="text-xs text-gold/70">{meta}</p>
        )}
        <p className="flex-1 text-sm leading-relaxed text-white/40">{desc}</p>
        <span className="text-xs font-medium opacity-0 translate-x-[-4px] transition-all duration-300 group-hover:opacity-60 group-hover:translate-x-0"
              style={{ color: '#C9A96E' }}>View services →</span>
      </div>
    </Link>
  )
}

function ProgramCard({ number, title, duration, level, desc, slug, img1, img2 }) {
  return (
    <Link
      to={slug ? `/academy/${slug}` : '/academy'}
      className="group relative overflow-hidden rounded-xl cursor-pointer block transition-all duration-300"
      style={{ background: 'rgba(32,10,22,0.85)', border: '1px solid rgba(196,24,80,0.18)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,24,80,0.18)' }}
    >
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img src={img1} alt={title}
          className="absolute inset-0 w-full h-full object-cover scale-100 transition-all duration-700 ease-in-out group-hover:opacity-0 group-hover:scale-105" />
        <img src={img2} alt={title}
          className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 transition-all duration-700 ease-in-out group-hover:opacity-100 group-hover:scale-100" />
        <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(32,10,22,1), transparent)' }} />
        <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-[0.3em]"
              style={{ color: 'rgba(196,24,80,0.7)' }}>{number}</span>
      </div>

      <div className="p-6 flex flex-col gap-3">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
             style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(196,24,80,0.08) 0%, transparent 70%)' }} />
        <h3 className="text-xl font-semibold text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide"
                style={{ background: 'rgba(196,24,80,0.15)', color: '#E8557A', border: '1px solid rgba(196,24,80,0.25)' }}>
            {duration}
          </span>
          <span className="text-[10px] text-white/30">{level}</span>
        </div>
        <div className="h-px w-full"
             style={{ background: 'linear-gradient(to right, rgba(196,24,80,0.3), rgba(201,169,110,0.3), transparent)' }} />
        <p className="text-sm leading-relaxed text-white/40">{desc}</p>
        <span className="text-xs font-medium opacity-0 translate-x-[-4px] transition-all duration-300 group-hover:opacity-60 group-hover:translate-x-0"
              style={{ color: '#C9A96E' }}>View course →</span>
      </div>
    </Link>
  )
}

function HomeCardSkeleton({ count = 3, cols = 'md:grid-cols-3' }) {
  return (
    <div className={`grid grid-cols-1 gap-5 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl"
          style={{ background: 'rgba(26,20,8,0.7)', border: '1px solid rgba(201,169,110,0.08)', minHeight: 280 }}
        >
          <div className="h-40 bg-white/[0.06]" />
          <div className="space-y-3 p-6">
            <div className="h-4 w-2/3 rounded bg-white/[0.08]" />
            <div className="h-3 w-full rounded bg-white/[0.05]" />
            <div className="h-3 w-5/6 rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  )
}
