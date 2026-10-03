export default function SectionHero({ eyebrow, title, subtitle, variant = 'gold' }) {
  const isCherry = variant === 'cherry'

  const bg = isCherry
    ? 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(180,20,65,0.18) 0%, #0E0409 55%)'
    : 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(201,169,110,0.14) 0%, #0B0907 55%)'

  const accentColor = isCherry ? 'rgba(196,24,80,0.7)' : 'rgba(201,169,110,0.65)'
  const lineColor   = isCherry ? 'rgba(196,24,80,0.35)' : 'rgba(201,169,110,0.35)'

  return (
    <section
      className="relative overflow-hidden px-4 py-20 text-center md:py-28"
      style={{ background: bg }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)' }}
      />

      <div className="relative mx-auto max-w-3xl">
        {eyebrow && (
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8" style={{ background: lineColor }} />
            <p
              className="text-[10px] font-medium tracking-[0.45em] uppercase"
              style={{ color: accentColor }}
            >
              {eyebrow}
            </p>
            <span className="h-px w-8" style={{ background: lineColor }} />
          </div>
        )}

        <h1
          className="text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-[3.5rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/45">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
