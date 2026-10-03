import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../lib/useFetch'
import { asList } from '../lib/list'
import { salonApi } from '../api/salon.api'
import SectionHero from '../components/common/SectionHero'
import StaffAvatar from '../components/common/StaffAvatar'
import ReviewCard from '../components/common/ReviewCard'
import { Reveal, StaggerReveal } from '../components/common/Reveal'
import { ErrorState } from '../components/common/PageStates'

function fmtPrice(price) {
  if (!price) return null
  return `₹${Number(price).toLocaleString('en-IN')}`
}

export default function StaffDetail() {
  const { id } = useParams()
  const { data: member, loading, error } = useFetch(() => salonApi.getStaffMember(id), [id])
  const { data: servicesData } = useFetch(() => salonApi.getStaffServices(id), [id])
  const { data: availabilityData } = useFetch(() => salonApi.getStaffAvailability(id), [id])
  const { data: reviewsData } = useFetch(() => salonApi.getPublicReviews({ staff: id }), [id])

  const services = asList(servicesData).filter((s) => s.is_active !== false)
  const availability = asList(availabilityData)
  const reviews = asList(reviewsData)
  const name = member?.user_name || 'Artist'

  if (error) {
    return (
      <div style={{ background: '#0B0907', minHeight: '60vh' }} className="flex flex-col items-center justify-center gap-4">
        <ErrorState msg="This artist profile is unavailable." />
        <Link to="/staff" className="text-sm text-gold">← Back to our team</Link>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, #0B0907 0%, #111009 60%, #0D0B05 100%)' }}>
      <SectionHero
        eyebrow="SALON ARTIST"
        title={loading ? '…' : name}
        subtitle={!loading && member?.bio ? member.bio : undefined}
        variant="gold"
      />

      <div className="mx-auto max-w-4xl px-4 py-16 space-y-14">
        {!loading && member && (
          <Reveal className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <StaffAvatar name={name} photo={member.photo_url || member.photo || null} size="xl" />
            <div className="flex-1">
              {member.review_count > 0 && (
                <p className="text-sm text-gold">
                  {'★'.repeat(Math.round(member.avg_rating || 0))}
                  <span className="ml-2 text-white/40">{member.avg_rating} ({member.review_count} {member.review_count === 1 ? 'review' : 'reviews'})</span>
                </p>
              )}
              <div className="mt-5">
                <Link
                  to={`/book?staff=${member.id}`}
                  className="btn-gold-shimmer inline-flex items-center rounded-full px-7 py-2.5 text-sm font-semibold tracking-wide"
                >
                  Book with {name.split(' ')[0]}
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {availability.length > 0 && (
          <Reveal>
            <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gold/60">Availability</p>
            <div className="flex flex-wrap gap-2">
              {availability.map((slot) => (
                <span
                  key={`${slot.day}-${slot.start_time}`}
                  className="rounded-full px-3 py-1.5 text-xs text-white/70"
                  style={{ background: 'rgba(20,16,6,0.85)', border: '1px solid rgba(201,169,110,0.16)' }}
                >
                  {slot.day} · {slot.start_time}–{slot.end_time}
                </span>
              ))}
            </div>
          </Reveal>
        )}

        {services.length > 0 && (
          <Reveal>
            <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold/60">Services</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map((svc) => (
                <Link
                  key={svc.id}
                  to={`/services/${svc.id}`}
                  className="flex items-center justify-between rounded-xl px-5 py-4 transition-colors hover:border-gold/40"
                  style={{ background: 'rgba(20,16,6,0.8)', border: '1px solid rgba(201,169,110,0.12)' }}
                >
                  <span className="text-sm text-white">{svc.name}</span>
                  {fmtPrice(svc.price) && <span className="text-sm text-gold">{fmtPrice(svc.price)}</span>}
                </Link>
              ))}
            </div>
          </Reveal>
        )}

        {reviews.length > 0 && (
          <div>
            <Reveal className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold/60">Client reviews</p>
            </Reveal>
            <StaggerReveal className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {reviews.slice(0, 8).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </StaggerReveal>
          </div>
        )}

        <Reveal className="text-center">
          <Link to="/staff" className="text-sm text-white/40 hover:text-gold">← Our team</Link>
        </Reveal>
      </div>
    </div>
  )
}
