import { Link } from 'react-router-dom'
import { useFetch } from '../lib/useFetch'
import { salonApi } from '../api/salon.api'
import { academyApi } from '../api/academy.api'
import SectionHero from '../components/common/SectionHero'
import StaffAvatar from '../components/common/StaffAvatar'
import { Reveal, StaggerReveal } from '../components/common/Reveal'
import { LoadingGrid, ErrorState, EmptyState } from '../components/common/PageStates'

function StaffCard({ member }) {
  const name = member.user_name || 'Artist'

  return (
    <div
      className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-xl p-7 text-center transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'rgba(20,16,6,0.9)', border: '1px solid rgba(201,169,110,0.1)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.1)')}
    >
      <Link to={`/staff/${member.id}`} className="absolute inset-0 z-0" aria-label={`View ${name}`} />
      <div className="pointer-events-none absolute right-0 top-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ width: 40, height: 40, background: 'linear-gradient(225deg, rgba(201,169,110,0.12) 0%, transparent 60%)' }} />

      <div className="relative">
        <StaffAvatar name={name} photo={member.photo_url || member.photo || null} size="lg" />
        {member.is_active !== false && (
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full"
            style={{ background: '#1A6E35', border: '2px solid rgba(20,16,6,0.9)', boxShadow: '0 0 6px rgba(26,110,53,0.5)' }} />
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white transition-colors duration-200 group-hover:text-gold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{name}</h3>
        {member.review_count > 0 && (
          <p className="mt-1 text-xs" style={{ color: '#C9A96E' }}>
            {'★'.repeat(Math.round(member.avg_rating || 0))}
            <span className="ml-1.5 text-white/35">{member.avg_rating} ({member.review_count})</span>
          </p>
        )}
        {member.user_email && <p className="mt-0.5 text-[11px] text-white/30">{member.user_email}</p>}
      </div>

      {member.bio && <p className="line-clamp-3 text-[13px] leading-relaxed text-white/40">{member.bio}</p>}

      <div className="w-full" style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.2), transparent)' }} />

      <Link to={`/book?staff=${member.id}`}
        className="relative z-10 rounded-md border px-5 py-2 text-xs font-medium tracking-wide transition-all duration-200"
        style={{ borderColor: 'rgba(201,169,110,0.25)', color: 'rgba(201,169,110,0.65)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#C9A96E' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.25)'; e.currentTarget.style.color = 'rgba(201,169,110,0.65)' }}
      >
        Book with {name.split(' ')[0]}
      </Link>
    </div>
  )
}

function TrainerCard({ trainer }) {
  const name = trainer.full_name || 'Trainer'

  return (
    <div
      className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-xl p-7 text-center transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'rgba(17,6,16,0.9)', border: '1px solid rgba(155,90,110,0.12)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(155,90,110,0.4)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(155,90,110,0.12)')}
    >
      <Link to={`/academy/trainers/${trainer.id}`} className="absolute inset-0 z-0" aria-label={`View ${name}`} />
      <div className="pointer-events-none absolute right-0 top-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ width: 40, height: 40, background: 'linear-gradient(225deg, rgba(155,90,110,0.12) 0%, transparent 60%)' }} />

      <span className="absolute top-4 left-4 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(155,90,110,0.15)', color: '#c97b90', border: '1px solid rgba(155,90,110,0.3)' }}>
        Academy
      </span>

      <div className="relative mt-3">
        <StaffAvatar name={name} photo={trainer.photo_url || null} size="lg" accentColor="#9b5a6e" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white transition-colors duration-200"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {name}
        </h3>
        {trainer.specialization && (
          <p className="mt-0.5 text-[11px]" style={{ color: '#c97b90' }}>{trainer.specialization}</p>
        )}
      </div>

      {trainer.bio && <p className="line-clamp-3 text-[13px] leading-relaxed text-white/40">{trainer.bio}</p>}

      <div className="w-full" style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(155,90,110,0.2), transparent)' }} />

      <Link to={`/academy/trainers/${trainer.id}`}
        className="relative z-10 rounded-md border px-5 py-2 text-xs font-medium tracking-wide transition-all duration-200"
        style={{ borderColor: 'rgba(155,90,110,0.25)', color: 'rgba(201,123,144,0.65)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c97b90'; e.currentTarget.style.color = '#c97b90' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(155,90,110,0.25)'; e.currentTarget.style.color = 'rgba(201,123,144,0.65)' }}
      >
        View profile
      </Link>
    </div>
  )
}

function SectionLabel({ eyebrow, title, accent }) {
  return (
    <Reveal className="mb-10">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}40)` }} />
        <div className="text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: accent }}>{eyebrow}</p>
          <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}40, transparent)` }} />
      </div>
    </Reveal>
  )
}

export default function Staff() {
  const { data: staff,    loading: staffLoading,   error: staffError,   refetch: refetchStaff }    = useFetch(() => salonApi.getStaff())
  const { data: trainers, loading: trainerLoading, error: trainerError, refetch: refetchTrainers } = useFetch(() => academyApi.getTrainers())

  const activeStaff    = (staff    || []).filter((m) => m.is_active !== false)
  const activeTrainers = (trainers || []).filter((t) => t.is_active !== false)

  const loading = staffLoading || trainerLoading

  return (
    <div style={{ background: 'linear-gradient(180deg, #0B0907 0%, #111009 60%, #0D0B05 100%)' }}>
      <SectionHero
        eyebrow="MEET THE TEAM"
        title={<>Our <span className="text-gold">People</span></>}
        subtitle="Salon artists and academy trainers — all united by mastery, passion, and the SLEITH standard."
        variant="gold"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 space-y-20">
        <div>
          <SectionLabel eyebrow="Salon" title="Our Artists" accent="#c9a96e" />

          {staffLoading && <LoadingGrid count={6} />}
          {staffError   && <ErrorState msg={staffError} onRetry={refetchStaff} />}
          {!staffLoading && !staffError && (
            activeStaff.length === 0
              ? <EmptyState msg="Our salon team profiles are being updated. Check back soon." />
              : <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {activeStaff.map((m) => <StaffCard key={m.id} member={m} />)}
                </StaggerReveal>
          )}
        </div>

        <div>
          <SectionLabel eyebrow="Academy" title="Our Trainers" accent="#9b5a6e" />

          {trainerLoading && <LoadingGrid count={3} />}
          {trainerError   && <ErrorState msg={trainerError} onRetry={refetchTrainers} />}
          {!trainerLoading && !trainerError && (
            activeTrainers.length === 0
              ? <EmptyState msg="Trainer profiles coming soon." />
              : <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {activeTrainers.map((t) => <TrainerCard key={t.id} trainer={t} />)}
                </StaggerReveal>
          )}
        </div>

        <Reveal className="flex flex-col items-center gap-4 text-center pt-4">
          <div className="h-px w-20" style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.3), transparent)' }} />
          <p className="text-sm text-white/40">Ready to experience SLEITH?</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link to="/book"
              className="btn-gold-shimmer inline-flex items-center rounded-full px-8 py-3 text-sm font-semibold tracking-wide">
              Book an Appointment
            </Link>
            <Link to="/academy"
              className="inline-flex items-center rounded-full px-8 py-3 text-sm font-medium border transition-all"
              style={{ borderColor: 'rgba(155,90,110,0.3)', color: 'rgba(201,123,144,0.7)' }}>
              Explore Academy →
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
