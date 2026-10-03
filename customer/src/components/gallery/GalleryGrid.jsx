import { useState, useCallback } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import GalleryLightbox from './GalleryLightbox'
import { useFetch } from '../../lib/useFetch'
import { galleryApi } from '../../api/gallery.api'
import { LoadingGrid, ErrorState } from '../common/PageStates'

/* ──────────────────────────────────────────────────────────────────────────
   Placeholder items — rich layered gradients that read as editorial photos.
   Replace { src } with a real URL/import when photography is available.
   Each gradient is built with two radial layers: a bright "subject highlight"
   over a dark ambient base — giving the illusion of a backlit studio shot.
────────────────────────────────────────────────────────────────────────────*/
export const DEFAULT_ITEMS = [
  {
    id: 1,
    label: 'The Hair Ritual',
    category: 'Salon',
    span: true,           // tall card — row-span-2
    src: null,
    bg: [
      'radial-gradient(ellipse 30% 55% at 52% 22%, rgba(237,217,163,0.42) 0%, rgba(201,169,110,0.14) 45%, transparent 70%)',
      'radial-gradient(ellipse 80% 70% at 40% 82%, rgba(201,169,110,0.16) 0%, #1C1408 52%, #0A0806 100%)',
    ],
  },
  {
    id: 2,
    label: 'Precision Cut',
    category: 'Salon',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 22% 65% at 63% 18%, rgba(201,169,110,0.38) 0%, rgba(168,133,80,0.08) 55%, transparent 72%)',
      'radial-gradient(ellipse 70% 80% at 58% 55%, rgba(140,100,40,0.09) 0%, #111009 58%, #0A0806 100%)',
    ],
  },
  {
    id: 3,
    label: 'Colour Alchemy',
    category: 'Salon',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 40% 40% at 45% 30%, rgba(201,169,110,0.30) 0%, rgba(201,169,110,0.06) 60%, transparent 80%)',
      'radial-gradient(ellipse 85% 55% at 20% 75%, rgba(201,169,110,0.12) 0%, #161008 60%, #0C0905 100%)',
    ],
  },
  {
    id: 4,
    label: 'Skin Luminescence',
    category: 'Salon',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 35% 50% at 55% 25%, rgba(237,217,163,0.28) 0%, rgba(196,24,80,0.06) 55%, transparent 75%)',
      'radial-gradient(ellipse 65% 75% at 48% 60%, rgba(196,24,80,0.14) 0%, #1A0B12 58%, #0E0609 100%)',
    ],
  },
  {
    id: 5,
    label: 'Academy Studio',
    category: 'Academy',
    span: true,           // tall card
    src: null,
    bg: [
      'radial-gradient(ellipse 45% 45% at 50% 30%, rgba(232,85,122,0.32) 0%, rgba(196,24,80,0.10) 50%, transparent 72%)',
      'radial-gradient(ellipse 75% 65% at 55% 70%, rgba(196,24,80,0.18) 0%, #200A18 48%, #140610 100%)',
    ],
  },
  {
    id: 6,
    label: 'Gold Touch',
    category: 'Salon',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 28% 58% at 38% 20%, rgba(237,217,163,0.45) 0%, rgba(201,169,110,0.12) 50%, transparent 70%)',
      'radial-gradient(ellipse 80% 65% at 30% 75%, rgba(201,169,110,0.18) 0%, #1A1206 58%, #0D0904 100%)',
    ],
  },
  {
    id: 7,
    label: 'Nail Artistry',
    category: 'Salon',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 50% 35% at 60% 55%, rgba(201,169,110,0.22) 0%, rgba(201,169,110,0.04) 60%, transparent 80%)',
      'radial-gradient(ellipse 55% 80% at 50% 50%, rgba(168,133,80,0.08) 0%, #141008 65%, #0B0906 100%)',
    ],
  },
  {
    id: 8,
    label: 'Master Class',
    category: 'Academy',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 40% 48% at 50% 28%, rgba(232,85,122,0.25) 0%, rgba(196,24,80,0.06) 55%, transparent 75%)',
      'radial-gradient(ellipse 70% 60% at 35% 72%, rgba(196,24,80,0.14) 0%, #1A0A14 60%, #110610 100%)',
    ],
  },
  {
    id: 9,
    label: 'Body Ritual',
    category: 'Salon',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 32% 52% at 55% 22%, rgba(201,169,110,0.35) 0%, rgba(168,133,80,0.07) 52%, transparent 72%)',
      'radial-gradient(ellipse 75% 65% at 42% 78%, rgba(201,169,110,0.12) 0%, #130E06 62%, #0B0905 100%)',
    ],
  },
  {
    id: 10,
    label: 'Certification Day',
    category: 'Academy',
    span: false,
    src: null,
    bg: [
      'radial-gradient(ellipse 55% 40% at 52% 45%, rgba(232,85,122,0.28) 0%, rgba(196,24,80,0.08) 60%, transparent 80%)',
      'radial-gradient(ellipse 80% 60% at 50% 65%, rgba(196,24,80,0.20) 0%, #220A18 48%, #140610 100%)',
    ],
  },
]

/* ── Spring preset ─────────────────────────────────────────────────────────── */
const MORPH_SPRING = { type: 'spring', stiffness: 290, damping: 33, mass: 0.9 }

/* ── Single grid item ──────────────────────────────────────────────────────── */
function GalleryItem({ item, isDimmed, isSelected, onClick }) {
  const bgStyle = {
    background: item.src ? undefined : item.bg.join(', '),
  }

  return (
    <motion.div
      layoutId={`gallery-item-${item.id}`}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl ${item.span ? 'row-span-2' : ''}`}
      style={{
        ...bgStyle,
        cursor: 'pointer',
        willChange: 'transform, opacity',
      }}
      animate={{
        opacity: isDimmed ? 0.22 : 1,
        scale:   isDimmed ? 0.97 : 1,
      }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Real photo (when available) */}
      {item.src && (
        <img
          src={item.src}
          alt={item.label}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}

      {/* ── Hover: gold ring border ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: 'inset 0 0 0 1.5px rgba(201,169,110,0.55)' }}
      />

      {/* ── Hover: inner gold glow ── */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(201,169,110,0.1) 0%, transparent 70%)',
        }}
      />

      {/* ── Label overlay ── */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 transition-all duration-300"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
        }}
      >
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase"
           style={{ color: item.category === 'Academy' ? 'rgba(232,85,122,0.75)' : 'rgba(201,169,110,0.7)' }}>
          {item.category}
        </p>
        <p className="text-sm font-semibold leading-tight text-white/85"
           style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {item.label}
        </p>
      </div>

      {/* ── Expand hint — appears on hover ── */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div
          className="rounded-full px-3 py-1.5 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(201,169,110,0.35)' }}
        >
          <span className="text-[11px] font-medium tracking-[0.2em] text-gold/80">VIEW</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main GalleryGrid component ────────────────────────────────────────────── */
export default function GalleryGrid({ items: propItems }) {
  const { data: apiItems, loading, error, refetch } = useFetch(() => galleryApi.getItems())
  const [selectedId, setSelectedId] = useState(null)

  /**
   * Normalise API items → same shape the component already understands.
   * If the backend has no items yet, fall back to the built-in placeholders.
   */
  const normalise = (raw) =>
    raw.map((item) => ({
      id:          item.id,
      label:       item.title,
      category:    item.category === 'academy' ? 'Academy' : 'Salon',
      span:        false,                       // API items are uniform height
      src:         item.image_url || null,
      description: item.description || '',
      bg: item.image_url
        ? undefined                              // real photo — no bg needed
        : DEFAULT_ITEMS[item.id % DEFAULT_ITEMS.length]?.bg ?? DEFAULT_ITEMS[0].bg,
    }))

  const items =
    loading || error
      ? []
      : apiItems && apiItems.length > 0
        ? normalise(apiItems)
        : propItems ?? DEFAULT_ITEMS   // ← fallback to built-in placeholders

  const selectedIndex = items.findIndex((i) => i.id === selectedId)

  const handleClose = useCallback(() => setSelectedId(null), [])

  const handleNavigate = useCallback(
    (dir) => {
      const next = (selectedIndex + dir + items.length) % items.length
      setSelectedId(items[next].id)
    },
    [selectedIndex, items]
  )

  if (loading) return <LoadingGrid count={6} />
  if (error)   return <ErrorState msg={error} onRetry={refetch} />

  return (
    <LayoutGroup>
      {/* ── Grid ── */}
      <div
        className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3"
        style={{ gridAutoRows: '220px' }}
      >
        {items.map((item) => (
          <GalleryItem
            key={item.id}
            item={item}
            isSelected={item.id === selectedId}
            isDimmed={selectedId !== null && item.id !== selectedId}
            onClick={() => setSelectedId(item.id)}
          />
        ))}
      </div>

      {/* ── Backdrop (separate AnimatePresence so it doesn't re-fade on navigate) ── */}
      <AnimatePresence>
        {selectedId !== null && (
          <motion.div
            key="gallery-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeInOut' }}
            onClick={handleClose}
            className="fixed inset-0 z-[100]"
            style={{
              background: 'rgba(7,5,3,0.93)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Lightbox (re-keyed on navigation → triggers layoutId morph) ── */}
      <AnimatePresence>
        {selectedId !== null && (
          <GalleryLightbox
            key={selectedId}
            item={items.find((i) => i.id === selectedId)}
            currentIndex={selectedIndex}
            totalCount={items.length}
            onClose={handleClose}
            onNavigate={handleNavigate}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}
