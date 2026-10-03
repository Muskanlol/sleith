import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { academyApi } from '../../api/academy.api'
import { asList } from '../../lib/list'
import SectionHero from '../../components/common/SectionHero'
import { Reveal, StaggerReveal } from '../../components/common/Reveal'
import { ErrorState } from '../../components/common/PageStates'

function ModuleItem({ module, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="overflow-hidden rounded-xl transition-all duration-200"
      style={{
        background: open ? 'rgba(32,10,22,0.9)' : 'rgba(22,6,16,0.7)',
        border: `1px solid ${open ? 'rgba(201,169,110,0.3)' : 'rgba(196,24,80,0.12)'}`,
      }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-medium tracking-[0.25em] w-6 flex-shrink-0"
            style={{ color: 'rgba(196,24,80,0.6)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm font-medium text-white/85">{module.title}</span>
        </div>
        <span
          className="text-gold/50 transition-transform duration-200 flex-shrink-0 text-lg"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>

      {open && module.description && (
        <div className="px-6 pb-5 pt-0">
          <div className="h-px w-full mb-4"
            style={{ background: 'linear-gradient(to right, rgba(196,24,80,0.2), rgba(201,169,110,0.2), transparent)' }} />
          <p className="text-sm leading-relaxed text-white/45">{module.description}</p>
        </div>
      )}
    </div>
  )
}

function HighlightCard({ icon, title, desc }) {
  return (
    <div
      className="flex gap-4 p-5 rounded-xl"
      style={{ background: 'rgba(22,6,16,0.7)', border: '1px solid rgba(196,24,80,0.12)' }}
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-white mb-1">{title}</p>
        <p className="text-xs leading-relaxed text-white/40">{desc}</p>
      </div>
    </div>
  )
}

export default function CourseDetail() {
  const { id } = useParams()

  const { data: course,  loading: courseLoading, error: courseError } = useFetch(() => academyApi.getCourse(id),        [id])
  const { data: modules, loading: modLoading }                        = useFetch(() => academyApi.getCourseModules(id), [id])

  const loading = courseLoading || modLoading

  if (courseError) {
    return (
      <div style={{ background: '#0E0409', minHeight: '60vh' }} className="flex items-center justify-center">
        <ErrorState msg="Course not found or unavailable." />
      </div>
    )
  }

  const sortedModules = asList(modules).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div style={{ background: 'linear-gradient(180deg, #0E0409 0%, #140610 50%, #0D0409 100%)' }}>
      <SectionHero
        eyebrow="SLEITH ACADEMY"
        title={
          loading ? '…' : (
            <em className="not-italic" style={{
              background: 'linear-gradient(90deg, #C41850 0%, #C9A96E 60%, #E8557A 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {course?.name}
            </em>
          )
        }
        subtitle={!loading && course?.description ? course.description : undefined}
        variant="cherry"
      />

      <div className="mx-auto max-w-4xl px-4 py-16">
        {!loading && course && (
          <Reveal className="mb-12">
            {(course.image_before_url || course.image_after_url) && (
              <div className="group mb-6 overflow-hidden rounded-2xl relative h-56 md:h-72">
                <img
                  src={course.image_before_url || course.image_after_url}
                  alt={course.name}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:opacity-0"
                />
                {course.image_after_url && (
                  <img
                    src={course.image_after_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  />
                )}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, #0E0409, transparent 55%)' }} />
              </div>
            )}
            <div
              className="flex flex-wrap items-center justify-between gap-6 rounded-2xl px-8 py-6"
              style={{ background: 'rgba(22,6,16,0.8)', border: '1px solid rgba(196,24,80,0.18)' }}
            >
              <div className="flex flex-wrap gap-8">
                {course.duration_months && (
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-[0.3em] text-white/30">Duration</p>
                    <p className="text-sm font-semibold text-white">{course.duration_months} month{course.duration_months !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {course.fee && (
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-[0.3em] text-white/30">Course Fee</p>
                    <p className="text-sm font-semibold" style={{ color: '#c9a96e' }}>
                      ₹{Number(course.fee).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="mb-0.5 text-[10px] uppercase tracking-[0.3em] text-white/30">Certification</p>
                  <p className="text-sm font-semibold text-white">SLEITH Certified</p>
                </div>
              </div>
              <Link
                to={`/academy/${id}/apply`}
                className="inline-flex items-center rounded-full px-7 py-2.5 text-sm font-semibold tracking-wide"
                style={{ background: 'linear-gradient(135deg, #C41850, #9b2563)', color: '#fff' }}
              >
                Apply Now →
              </Link>
            </div>
          </Reveal>
        )}

        <Reveal className="mb-14">
          <div className="mb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(196,24,80,0.7)' }}>
              Why Choose This
            </p>
            <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              What makes this course <span style={{ color: '#c9a96e' }}>different</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <HighlightCard
              icon="🎓"
              title="Industry-Led Curriculum"
              desc="Designed with working professionals — every module reflects what clients and salons actually need today."
            />
            <HighlightCard
              icon="🤝"
              title="Hands-On Practice"
              desc="Real models, real tools, real feedback. You don't just learn theory — you do the work."
            />
            <HighlightCard
              icon="📜"
              title="SLEITH Certification"
              desc="Graduate with a certificate recognised by partner salons and academies across the industry."
            />
            <HighlightCard
              icon="📅"
              title="Flexible Scheduling"
              desc="Tell us your preference — weekday, weekend, morning or evening — and we'll match you to the right batch."
            />
          </div>
        </Reveal>

        <div className="mb-16">
          <Reveal className="mb-6">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(196,24,80,0.7)' }}>
                Curriculum
              </p>
              <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Course <span style={{ color: '#c9a96e' }}>Modules</span>
              </h2>
            </div>
          </Reveal>

          {modLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(22,6,16,0.5)' }} />
              ))}
            </div>
          ) : sortedModules.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-8 text-center"
              style={{ background: 'rgba(22,6,16,0.7)', border: '1px solid rgba(196,24,80,0.14)' }}
            >
              <p className="text-sm text-white/55 mb-2">Curriculum is being finalised for this course.</p>
              <p className="text-xs text-white/35 leading-relaxed max-w-md mx-auto">
                Apply anyway — the full module list is shared with your offer, and you can review it anytime from My Academy after enrollment.
              </p>
            </div>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {sortedModules.map((m, i) => (
                <ModuleItem key={m.id} module={m} index={i} />
              ))}
            </StaggerReveal>
          )}
        </div>

        <Reveal className="mb-16">
          <div
            className="rounded-2xl p-8"
            style={{ background: 'rgba(22,6,16,0.7)', border: '1px solid rgba(201,169,110,0.12)' }}
          >
            <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(201,169,110,0.55)' }}>
              How It Works
            </p>
            <h2 className="text-xl font-semibold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              The enrolment journey
            </h2>
            <ol className="space-y-5">
              {[
                { n: '01', title: 'Submit Application', desc: 'Fill in the short form with your schedule preferences and motivation. Takes under 2 minutes.' },
                { n: '02', title: 'We Review',          desc: 'Our academy team reviews your application within 48 hours and reaches out personally.' },
                { n: '03', title: 'Batch Assignment',   desc: 'We match you to the batch that best fits your schedule. If a new batch is needed, we give you an estimated start date.' },
                { n: '04', title: 'Fee & Confirmation', desc: 'Pay the course fee (instalments available) and your seat is confirmed. Your journey begins.' },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex gap-5">
                  <span
                    className="text-2xl font-bold flex-shrink-0 leading-none mt-0.5"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: 'rgba(201,169,110,0.2)',
                    }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                    <p className="text-xs leading-relaxed text-white/40">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal className="flex flex-col items-center gap-5 text-center">
          <div className="h-px w-24"
            style={{ background: 'linear-gradient(to right, transparent, rgba(196,24,80,0.4), rgba(201,169,110,0.4), transparent)' }} />
          <h3 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to begin?
          </h3>
          <p className="max-w-sm text-sm text-white/40">
            Submit your application and an academy team member will reach out within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              to={`/academy/${id}/apply`}
              className="inline-flex items-center rounded-full px-10 py-3.5 text-sm font-semibold tracking-wide"
              style={{ background: 'linear-gradient(135deg, #C41850, #9b2563)', color: '#fff' }}
            >
              Apply Now →
            </Link>
            <Link to="/contact" className="text-xs text-white/30 hover:text-gold transition-colors">
              Have a question? Contact us →
            </Link>
          </div>
          <Link to="/academy" className="text-xs text-white/25 hover:text-white/50 transition-colors">
            ← Back to all courses
          </Link>
        </Reveal>
      </div>
    </div>
  )
}
