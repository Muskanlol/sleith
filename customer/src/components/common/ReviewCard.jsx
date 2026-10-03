import StaffAvatar from './StaffAvatar'

export default function ReviewCard({ review, accent = 'gold' }) {
  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0))
  const services = Array.isArray(review.service_names) ? review.service_names.filter(Boolean) : []
  const isCherry = accent === 'cherry'
  const gold = isCherry ? '#c97b90' : '#C9A96E'
  const border = isCherry ? 'rgba(196,24,80,0.16)' : 'rgba(201,169,110,0.14)'
  const bg = isCherry ? 'rgba(22,6,16,0.85)' : 'rgba(26,20,8,0.85)'

  return (
    <article
      className="flex flex-col gap-4 rounded-xl p-6"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center gap-3">
        <StaffAvatar
          name={review.customer_name || 'Guest'}
          photo={review.customer_photo_url || null}
          size="sm"
          accentColor={gold}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{review.customer_name || 'Guest'}</p>
          <p className="text-xs tracking-[0.2em]" style={{ color: gold }} aria-label={`${rating} out of 5 stars`}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
          </p>
        </div>
      </div>
      {review.comment && (
        <p className="flex-1 text-sm leading-relaxed text-white/65">
          “{review.comment}”
        </p>
      )}
      <div className="mt-auto border-t pt-4" style={{ borderColor: border }}>
        <p className="text-xs text-white/35">
          {[services.slice(0, 2).join(', '), review.staff_name ? `with ${review.staff_name}` : null]
            .filter(Boolean)
            .join(' · ') || 'SLEITH Salon'}
        </p>
      </div>
    </article>
  )
}
