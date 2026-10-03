import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../lib/useFetch'
import { salonApi } from '../api/salon.api'
import SectionHero from '../components/common/SectionHero'
import { Reveal, StaggerReveal } from '../components/common/Reveal'
import { LoadingGrid, ErrorState, EmptyState } from '../components/common/PageStates'

function fmtPrice(price) {
  if (!price) return null
  return `₹${Number(price).toLocaleString('en-IN')}`
}

function fmtDuration(mins) {
  if (!mins) return null
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-lg p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(20,16,6,0.92)',
        border: '1px solid rgba(201,169,110,0.1)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.1)')}
    >
      {service.image_url && (
        <div className="-mx-6 -mt-6 mb-1 aspect-square overflow-hidden bg-[#140F08]">
          <img
            src={service.image_url}
            alt={service.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,169,110,0.08) 0%, transparent 70%)',
        }}
      />

      <span
        className="self-start rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide"
        style={{
          background: 'rgba(201,169,110,0.12)',
          color: '#C9A96E',
          border: '1px solid rgba(201,169,110,0.2)',
        }}
      >
        {service.category_name || 'General'}
      </span>

      <h3
        className="text-lg font-semibold leading-tight text-white transition-colors duration-200 group-hover:text-gold"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {service.name}
      </h3>

      {service.review_count > 0 && (
        <p className="text-xs" style={{ color: '#C9A96E' }}>
          {'★'.repeat(Math.round(service.avg_rating || 0))}
          <span className="ml-1.5 text-white/35">
            {service.avg_rating} ({service.review_count})
          </span>
        </p>
      )}

      {service.description && (
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-white/40">
          {service.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-3"
           style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
        <div className="flex items-center gap-2 text-xs text-white/35">
          {fmtDuration(service.duration_minutes) && (
            <span>{fmtDuration(service.duration_minutes)}</span>
          )}
        </div>
        {fmtPrice(service.price) && (
          <span className="text-sm font-medium text-gold/80">{fmtPrice(service.price)}</span>
        )}
      </div>
    </Link>
  )
}

function CategoryPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-200"
      style={
        active
          ? {
              background: 'rgba(201,169,110,0.18)',
              color: '#C9A96E',
              border: '1px solid rgba(201,169,110,0.4)',
            }
          : {
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
            }
      }
    >
      {label}
    </button>
  )
}

export default function Services() {
  const { data: services, loading, error, refetch } = useFetch(() => salonApi.getServices())
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', ...new Set((services || []).map((s) => s.category_name).filter(Boolean))]

  const filtered =
    activeCategory === 'All'
      ? (services || [])
      : (services || []).filter((s) => s.category_name === activeCategory)

  const activeServices = filtered.filter((s) => s.is_active !== false)

  return (
    <div style={{ background: 'linear-gradient(180deg, #0B0907 0%, #111009 60%, #0D0B05 100%)' }}>
      <SectionHero
        eyebrow="SLEITH SALON"
        title={<>Our <span className="text-gold">Services</span></>}
        subtitle="Each ritual is designed around you — from 30-minute touch-ups to full-day transformations."
        variant="gold"
      />

      <section className="mx-auto max-w-7xl px-4 py-16">
        {loading && <LoadingGrid count={6} />}
        {error   && <ErrorState msg={error} onRetry={refetch} />}

        {!loading && !error && (
          <>
            {categories.length > 1 && (
              <Reveal className="mb-10 flex flex-nowrap justify-center gap-2.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat}
                    label={cat}
                    active={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                  />
                ))}
              </Reveal>
            )}

            {activeServices.length === 0 ? (
              <EmptyState msg="No services found in this category." />
            ) : (
              <StaggerReveal
                key={activeCategory}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {activeServices.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </StaggerReveal>
            )}

            <Reveal delay={0.1} className="mt-16 flex flex-col items-center gap-4 text-center">
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <p className="text-sm text-white/40">
                Not sure where to start? Our specialists will guide you.
              </p>
              <Link
                to="/register"
                className="btn-gold-shimmer inline-flex items-center rounded-md px-8 py-3 text-sm font-semibold tracking-wide"
              >
                Book a Consultation
              </Link>
            </Reveal>
          </>
        )}
      </section>
    </div>
  )
}
