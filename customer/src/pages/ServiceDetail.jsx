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

function fmtDuration(mins) {
  if (!mins) return null
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function ServiceDetail() {
  const { id } = useParams()
  const { data: service, loading, error } = useFetch(() => salonApi.getService(id), [id])
  const { data: staffData } = useFetch(() => salonApi.getServiceStaff(id), [id])
  const { data: reviewsData } = useFetch(() => salonApi.getPublicReviews({ service: id }), [id])

  const staff = asList(staffData).filter((m) => m.is_active !== false)
  const reviews = asList(reviewsData)

  if (error) {
    return (
      <div style={{ background: '#0B0907', minHeight: '60vh' }} className="flex flex-col items-center justify-center gap-4">
        <ErrorState msg="This service is unavailable." />
        <Link to="/services" className="text-sm text-gold">← Back to services</Link>
      </div>
    )
  }

  const photo = service?.image_url

  return (
    <div style={{ background: 'linear-gradient(180deg, #0B0907 0%, #111009 60%, #0D0B05 100%)' }}>
      <SectionHero
        eyebrow={loading ? 'SLEITH SALON' : (service?.category_name || 'SLEITH SALON')}
        title={
          loading ? '…' : (
            <>
              {service?.name}
            </>
          )
        }
        subtitle={!loading && service?.description ? service.description : undefined}
        variant="gold"
      />

      <div className="mx-auto max-w-4xl px-4 py-16 space-y-14">
        {!loading && service && (
          <Reveal>
            {photo && (
              <div
                className="mx-auto mb-8 w-fit max-w-full overflow-hidden rounded-2xl"
                style={{
                  background: 'rgba(20,16,6,0.92)',
                  border: '1px solid rgba(201,169,110,0.18)',
                }}
              >
                <img
                  src={photo}
                  alt={service.name}
                  className="block h-auto max-h-[min(70vh,640px)] w-auto max-w-full"
                />
              </div>
            )}

            <div
              className="flex flex-wrap items-center justify-between gap-6 rounded-2xl px-8 py-6"
              style={{ background: 'rgba(20,16,6,0.85)', border: '1px solid rgba(201,169,110,0.18)' }}
            >
              <div className="flex flex-wrap gap-8">
                {fmtDuration(service.duration_minutes) && (
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-[0.3em] text-white/30">Duration</p>
                    <p className="text-sm font-semibold text-white">{fmtDuration(service.duration_minutes)}</p>
                  </div>
                )}
                {fmtPrice(service.price) && (
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-[0.3em] text-white/30">From</p>
                    <p className="text-sm font-semibold text-gold">{fmtPrice(service.price)}</p>
                  </div>
                )}
                {service.review_count > 0 && (
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-[0.3em] text-white/30">Reviews</p>
                    <p className="text-sm font-semibold text-gold">
                      ★ {service.avg_rating} <span className="text-white/40 font-normal">({service.review_count})</span>
                    </p>
                  </div>
                )}
              </div>
              <Link
                to={`/book?service=${service.id}`}
                className="btn-gold-shimmer inline-flex items-center rounded-full px-7 py-2.5 text-sm font-semibold tracking-wide"
              >
                Book this service
              </Link>
            </div>
          </Reveal>
        )}

        {staff.length > 0 && (
          <Reveal>
            <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold/60">Artists for this ritual</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {staff.map((member) => {
                const name = member.user_name || 'Artist'
                return (
                  <Link
                    key={member.id}
                    to={`/staff/${member.id}`}
                    className="flex flex-col items-center gap-3 rounded-xl p-5 text-center transition-colors hover:border-gold/40"
                    style={{ background: 'rgba(20,16,6,0.8)', border: '1px solid rgba(201,169,110,0.12)' }}
                  >
                    <StaffAvatar name={name} photo={member.photo_url || member.photo || null} size="md" />
                    <p className="text-sm font-medium text-white">{name}</p>
                  </Link>
                )
              })}
            </div>
          </Reveal>
        )}

        {reviews.length > 0 && (
          <div>
            <Reveal className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold/60">What clients say</p>
            </Reveal>
            <StaggerReveal className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {reviews.slice(0, 6).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </StaggerReveal>
          </div>
        )}

        <Reveal className="text-center">
          <Link to="/services" className="text-sm text-white/40 hover:text-gold">← All services</Link>
        </Reveal>
      </div>
    </div>
  )
}
