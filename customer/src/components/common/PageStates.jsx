
const shimmer =
  'animate-pulse rounded bg-gradient-to-r from-white/[0.06] via-white/[0.12] to-white/[0.06]'

function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-lg p-7"
      style={{ background: 'rgba(26,20,8,0.7)', border: '1px solid rgba(201,169,110,0.07)' }}
    >
      <div className={`${shimmer} mb-4 h-3 w-10`} />
      <div className={`${shimmer} mb-2 h-5 w-3/4`} />
      <div className={`${shimmer} mb-1 h-3 w-1/2`} />
      <div className="mt-4 space-y-2">
        <div className={`${shimmer} h-3 w-full`} />
        <div className={`${shimmer} h-3 w-5/6`} />
      </div>
    </div>
  )
}

export function LoadingGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function ErrorState({ msg = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'rgba(185,28,28,0.15)', border: '1px solid rgba(185,28,28,0.3)' }}
      >
        <span className="text-xl">✕</span>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-white/50">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md border border-gold/30 px-5 py-2 text-xs font-medium tracking-wide text-gold/70 transition-colors hover:border-gold/60 hover:text-gold"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ msg = 'Nothing here yet.' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="text-2xl text-gold/30" style={{ fontFamily: "'Playfair Display', serif" }}>✦</span>
      <p className="text-sm text-white/40">{msg}</p>
    </div>
  )
}
