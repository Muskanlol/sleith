import { Reveal } from '../components/common/Reveal'
import SectionHero from '../components/common/SectionHero'
import GalleryGrid from '../components/gallery/GalleryGrid'

export default function Gallery() {
  return (
    <div style={{ background: 'linear-gradient(180deg, #0B0907 0%, #111009 60%, #0D0B05 100%)' }}>
      {/* Hero */}
      <SectionHero
        eyebrow="SLEITH GALLERY"
        title={
          <>
            Behind the <span className="text-gold">Craft</span>
          </>
        }
        subtitle="A curated window into the rituals, artistry, and education that define SLEITH."
        variant="gold"
      />

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-4 py-14 pb-20">
        {/* Section intro */}
        <Reveal className="mb-10 flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(201,169,110,0.35), transparent)' }} />
          <p className="text-[10px] font-medium tracking-[0.4em] uppercase text-gold/50">
            Click any image to explore
          </p>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(201,169,110,0.35), transparent)' }} />
        </Reveal>

        <GalleryGrid />
      </section>
    </div>
  )
}
