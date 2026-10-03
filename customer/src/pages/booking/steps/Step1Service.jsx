import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { bookingApi } from '../../../api/booking.api'

const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

export default function Step1Service({ booking, onSelect }) {
  const [services,   setServices]   = useState([])
  const [categories, setCategories] = useState([])
  const [active,     setActive]     = useState('All')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    bookingApi.getServices()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results ?? []
        setServices(list)
        const cats = ['All', ...new Set(list.map((s) => s.category_name ?? s.category?.name ?? 'General'))]
        setCategories(cats)
      })
      .catch(() => setError('Could not load services. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = active === 'All'
    ? services
    : services.filter((s) => (s.category_name ?? s.category?.name ?? 'General') === active)

  return (
    <div className="pt-4">
      <div className="text-center mb-10">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: 'var(--gold)' }}>
          Step 1 of 4
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Choose Your Service</h2>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          Select the treatment you'd like to experience.
        </p>
      </div>

      {!loading && !error && categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className="px-4 py-1.5 rounded-full text-xs tracking-widest uppercase transition-all duration-300 border"
              style={{
                background:  active === cat ? 'var(--gold)' : 'transparent',
                color:       active === cat ? '#0a0a0a'     : 'rgba(255,255,255,0.5)',
                borderColor: active === cat ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-red-400 py-16">{error}</p>
      )}

      {!loading && !error && (
        <motion.div
          variants={container} initial="hidden" animate="show"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((svc) => (
            <motion.div
              key={svc.id}
              variants={item}
              onClick={() => onSelect(svc)}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative p-6 rounded-2xl border cursor-pointer group overflow-hidden transition-all duration-300"
              style={{
                background:   booking.service?.id === svc.id
                  ? 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.06))'
                  : 'rgba(255,255,255,0.03)',
                borderColor:  booking.service?.id === svc.id ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.08) 0%, transparent 60%)' }}
              />

              {booking.service?.id === svc.id && (
                <span
                  className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full tracking-widest uppercase font-semibold"
                  style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                >
                  Selected
                </span>
              )}

              <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>
                {svc.category_name ?? svc.category?.name ?? 'General'}
              </p>
              <h3 className="text-white font-semibold text-lg mb-1 leading-snug">{svc.name}</h3>
              {svc.description && (
                <p className="text-white/40 text-xs leading-relaxed mb-4 line-clamp-2">{svc.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">
                  ⏱ {svc.duration_minutes ?? svc.duration} min
                </span>
                <span className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>
                  ₹{Number(svc.price).toLocaleString('en-IN')}
                </span>
              </div>

              <div
                className="mt-4 flex items-center gap-1 text-[11px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ color: 'var(--gold)' }}
              >
                Select →
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-white/30 py-16">No services in this category.</p>
      )}
    </div>
  )
}
