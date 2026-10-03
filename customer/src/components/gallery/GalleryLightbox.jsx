import { useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * GalleryLightbox
 *
 * Rendered inside an <AnimatePresence> keyed by selectedId.
 * The motion.div uses the SAME layoutId as the clicked grid item,
 * so Framer Motion automatically morphs between the two positions.
 *
 * Props:
 *   item          – the currently expanded gallery item object
 *   currentIndex  – 0-based index in the items array
 *   totalCount    – total number of items
 *   onClose       – () => void
 *   onNavigate    – (dir: +1 | -1) => void
 */

const MORPH_SPRING = { type: 'spring', stiffness: 290, damping: 33, mass: 0.9 }

export default function GalleryLightbox({ item, currentIndex, totalCount, onClose, onNavigate }) {
  /* ── Keyboard: Esc / ← / → ─────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  onNavigate(+1)
      if (e.key === 'ArrowLeft')   onNavigate(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNavigate])

  /* ── Scroll lock (mobile-safe) ──────────────────────────────────────────── */
  useEffect(() => {
    const prev = document.body.style.overflow
    const prevTouch = document.body.style.touchAction
    document.body.style.overflow   = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow   = prev
      document.body.style.touchAction = prevTouch
    }
  }, [])

  if (!item) return null

  const bgStyle = {
    background: item.src ? undefined : item.bg.join(', '),
  }

  return (
    <>
      {/* ── Expanded image — THE morphing element ────────────────────────── */}
      {/* z-[101] sits above the backdrop at z-[100] */}
      <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center px-4">
        <motion.div
          layoutId={`gallery-item-${item.id}`}
          className="pointer-events-auto relative overflow-hidden rounded-2xl"
          style={{
            ...bgStyle,
            width: 'min(88vw, 780px)',
            height: 'min(82vh, 580px)',
            willChange: 'transform',
          }}
          transition={MORPH_SPRING}
        >
          {/* Real photo */}
          {item.src && (
            <img
              src={item.src}
              alt={item.label}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}

          {/* Bottom caption strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.22, duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-7 py-6"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)',
            }}
          >
            <div>
              <p
                className="text-[10px] font-medium tracking-[0.4em] uppercase"
                style={{
                  color:
                    item.category === 'Academy'
                      ? 'rgba(232,85,122,0.8)'
                      : 'rgba(201,169,110,0.75)',
                }}
              >
                {item.category}
              </p>
              <p
                className="mt-0.5 text-xl font-semibold text-white"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {item.label}
              </p>
            </div>

            {/* Counter */}
            <p className="shrink-0 text-xs tabular-nums text-white/35">
              {String(currentIndex + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
            </p>
          </motion.div>

          {/* Gold corner accent lines */}
          <GoldCorners />
        </motion.div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.75 }}
        transition={{ delay: 0.18, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={onClose}
        aria-label="Close"
        className="fixed right-5 top-5 z-[102] flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200"
        style={{
          background: 'rgba(20,14,6,0.65)',
          border: '1px solid rgba(201,169,110,0.3)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
      >
        <CloseIcon />
      </motion.button>

      {/* Prev button */}
      <motion.button
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ delay: 0.20, duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        onClick={() => onNavigate(-1)}
        aria-label="Previous image"
        className="fixed left-4 top-1/2 z-[102] -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 md:left-6"
        style={{
          background: 'rgba(20,14,6,0.65)',
          border: '1px solid rgba(201,169,110,0.25)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.65)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.25)')}
      >
        <ArrowIcon direction="left" />
      </motion.button>

      {/* Next button */}
      <motion.button
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ delay: 0.20, duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        onClick={() => onNavigate(+1)}
        aria-label="Next image"
        className="fixed right-4 top-1/2 z-[102] -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 md:right-6"
        style={{
          background: 'rgba(20,14,6,0.65)',
          border: '1px solid rgba(201,169,110,0.25)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.65)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.25)')}
      >
        <ArrowIcon direction="right" />
      </motion.button>

      {/* ── Keyboard hint (fade out after 2s) ───────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 0.5, 0.5, 0] }}
        transition={{ delay: 0.5, duration: 2.8, times: [0, 0.2, 0.7, 1] }}
        className="fixed bottom-6 left-1/2 z-[102] -translate-x-1/2 text-[10px] tracking-[0.3em] text-white/35 pointer-events-none select-none"
      >
        ← ARROW KEYS TO NAVIGATE · ESC TO CLOSE →
      </motion.p>
    </>
  )
}

/* ── Tiny inline SVG icons ───────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 1l10 10M11 1L1 11" stroke="rgba(201,169,110,0.8)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon({ direction }) {
  const d =
    direction === 'left'
      ? 'M7 2L3 6l4 4'
      : 'M5 2l4 4-4 4'
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d={d} stroke="rgba(201,169,110,0.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Decorative gold corner lines ────────────────────────────────────────── */
function GoldCorners() {
  const size = 16
  const style = { position: 'absolute', width: size, height: size }
  const lineStyle = { stroke: 'rgba(201,169,110,0.45)', strokeWidth: 1.5, strokeLinecap: 'round' }

  return (
    <>
      {/* TL */}
      <svg style={{ ...style, top: 14, left: 14 }} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path d={`M${size} 0 L0 0 L0 ${size}`} {...lineStyle} />
      </svg>
      {/* TR */}
      <svg style={{ ...style, top: 14, right: 14 }} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path d={`M0 0 L${size} 0 L${size} ${size}`} {...lineStyle} />
      </svg>
      {/* BL */}
      <svg style={{ ...style, bottom: 14, left: 14 }} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path d={`M${size} ${size} L0 ${size} L0 0`} {...lineStyle} />
      </svg>
      {/* BR */}
      <svg style={{ ...style, bottom: 14, right: 14 }} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path d={`M0 ${size} L${size} ${size} L${size} 0`} {...lineStyle} />
      </svg>
    </>
  )
}
