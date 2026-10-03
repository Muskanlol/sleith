import { Link } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { academyApi } from '../../api/academy.api'
import { asList } from '../../lib/list'
import { useAuth } from '../../context/AuthContext'
import SectionHero from '../../components/common/SectionHero'
import StaffAvatar from '../../components/common/StaffAvatar'
import { Reveal, StaggerReveal } from '../../components/common/Reveal'
import { LoadingGrid, ErrorState, EmptyState } from '../../components/common/PageStates'

function CourseCard({ course }) {
  const img = course.image_before_url || course.image_after_url

  return (
    <Link
      to={`/academy/${course.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none"
      style={{
        background: 'rgba(22,6,16,0.9)',
        border: '1px solid rgba(196,24,80,0.15)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(196,24,80,0.15)')}
    >
      {img && (
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          <img
            src={course.image_before_url || img}
            alt={course.name}
            className="absolute inset-0 w-full h-full object-cover scale-100 transition-all duration-700 group-hover:opacity-0 group-hover:scale-105"
          />
          {course.image_after_url && (
            <img
              src={course.image_after_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-100"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(22,6,16,1), transparent)' }} />
        </div>
      )}

      <div className="relative flex flex-col p-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(196,24,80,0.1) 0%, transparent 70%)',
        }}
      />

      <div className="mb-5 flex items-start justify-between gap-3">
        {course.duration_months && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide"
            style={{
              background: 'rgba(196,24,80,0.15)',
              color: '#E8557A',
              border: '1px solid rgba(196,24,80,0.3)',
            }}
          >
            {course.duration_months} month{course.duration_months !== 1 ? 's' : ''}
          </span>
        )}
        {course.fee && (
          <span className="text-sm font-medium text-gold/70">
            ₹{Number(course.fee).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      <h3
        className="mb-3 text-xl font-semibold leading-tight text-white transition-colors duration-200 group-hover:text-gold"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {course.name}
      </h3>

      {course.description && (
        <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-white/40">
          {course.description}
        </p>
      )}

      <div
        className="mt-auto flex items-center gap-2 pt-4 text-[12px] font-medium text-gold/0 transition-all duration-300 group-hover:text-gold/60"
        style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}
      >
        View course details →
      </div>
      </div>
    </Link>
  )
}

function TrainerMiniCard({ trainer }) {
  const name = trainer.full_name || 'Trainer'
  return (
    <Link
      to={`/academy/trainers/${trainer.id}`}
      className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl transition-all hover:-translate-y-0.5"
      style={{ background: 'rgba(22,6,16,0.7)', border: '1px solid rgba(155,90,110,0.15)', textDecoration: 'none' }}
    >
      <StaffAvatar name={name} photo={trainer.photo_url || null} size="lg" accentColor="#9b5a6e" />
      <div>
        <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{name}</p>
        {trainer.specialization && (
          <p className="text-[11px] mt-0.5" style={{ color: '#c97b90' }}>{trainer.specialization}</p>
        )}
      </div>
      {trainer.bio && <p className="text-xs text-white/35 line-clamp-2 leading-relaxed">{trainer.bio}</p>}
    </Link>
  )
}

export default function AcademyPage() {
  const { isAuthenticated } = useAuth()
  const { data: courses,  loading,         error,         refetch }         = useFetch(() => academyApi.getCourses())
  const { data: trainers, loading: tLoad } = useFetch(() => academyApi.getTrainers())

  const activeCourses = asList(courses).filter((c) => c.is_active !== false)
  const activeTrainers = asList(trainers).filter((t) => t.is_active !== false)

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0E0409 0%, #140610 50%, #0D0409 100%)',
      }}
    >
      <SectionHero
        eyebrow="SLEITH ACADEMY"
        title={
          <>
            Where Passion Becomes{' '}
            <em
              className="not-italic"
              style={{
                background: 'linear-gradient(90deg, #C41850 0%, #C9A96E 60%, #E8557A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Profession
            </em>
          </>
        }
        subtitle="Industry-led courses designed for the real world. Learn from masters, get certified, build a career."
        variant="cherry"
      />

      <section className="mx-auto max-w-6xl px-4 py-16">
        {loading && <LoadingGrid count={6} />}
        {error   && <ErrorState msg={error} onRetry={refetch} />}

        {!loading && !error && (
          <>
            {activeCourses.length === 0 ? (
              <EmptyState msg="Courses are being added. Please check back soon." />
            ) : (
              <>
                <Reveal className="mb-10">
                  <p className="text-sm text-white/35">
                    {activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''} available
                  </p>
                </Reveal>

                <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {activeCourses.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </StaggerReveal>
              </>
            )}

            {(tLoad || activeTrainers.length > 0) && (
              <div className="mt-20">
                <Reveal>
                  <div className="text-center mb-10">
                    <p className="text-[10px] tracking-[0.35em] uppercase mb-2" style={{ color: 'rgba(155,90,110,0.7)' }}>
                      Learn from the Best
                    </p>
                    <h2 className="text-3xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Meet Our <span style={{ color: '#c97b90' }}>Trainers</span>
                    </h2>
                  </div>
                </Reveal>
                {tLoad ? (
                  <LoadingGrid count={3} />
                ) : (
                  <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {activeTrainers.map((t) => (
                      <TrainerMiniCard key={t.id} trainer={t} />
                    ))}
                  </StaggerReveal>
                )}
              </div>
            )}

            <Reveal delay={0.1} className="mt-16 flex flex-col items-center gap-4 text-center">
              <div
                className="h-px w-24"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(196,24,80,0.4), rgba(201,169,110,0.4), transparent)',
                }}
              />
              <p className="text-sm text-white/40">
                Have a question before applying? We'd love to hear from you.
              </p>
              <Link
                to={isAuthenticated ? '/account/applications' : '/register'}
                className="inline-flex items-center rounded-md border px-8 py-3 text-sm font-semibold tracking-wide transition-all duration-300"
                style={{
                  borderColor: 'rgba(196,24,80,0.4)',
                  color: '#F5E8EC',
                  background: 'rgba(196,24,80,0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C9A96E'
                  e.currentTarget.style.background = 'rgba(201,169,110,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196,24,80,0.4)'
                  e.currentTarget.style.background = 'rgba(196,24,80,0.08)'
                }}
              >
                {isAuthenticated ? 'View my applications' : 'Create an Account to Apply'}
              </Link>
            </Reveal>
          </>
        )}
      </section>
    </div>
  )
}
