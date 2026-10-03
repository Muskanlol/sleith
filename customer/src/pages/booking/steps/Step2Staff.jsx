import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { bookingApi } from '../../../api/booking.api'

const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

const GRADIENTS = [
  'linear-gradient(135deg,#c9a96e,#a07842)',
  'linear-gradient(135deg,#9b5a6e,#c97b90)',
  'linear-gradient(135deg,#6e8ec9,#4a6aa0)',
  'linear-gradient(135deg,#6ec99b,#42a07a)',
  'linear-gradient(135deg,#c96e6e,#a04242)',
]
const avatarGradient = (id) => GRADIENTS[id % GRADIENTS.length]

export default function Step2Staff({ booking, onSelect, onBack }) {
  const [staff,   setStaff]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!booking.service) return
    bookingApi.getServiceStaff(booking.service.id)
      .then(({ data }) => setStaff(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setError('Could not load stylists. Please try again.'))
      .finally(() => setLoading(false))
  }, [booking.service])

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  const photoUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8000'}${path}`
  }

  return (
    <div className="pt-4">
      <div className="text-center mb-10">
        <p className="tracking-[0.35em] text-xs uppercase mb-3" style={{ color: 'var(--gold)' }}>
          Step 2 of 4
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Choose Your Stylist</h2>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          All stylists below are qualified for{' '}
          <span style={{ color: 'var(--gold)' }}>{booking.service?.name}</span>.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={onBack}
          className="text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-all duration-300 hover:border-white/40"
          style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }}
        >
          ← Back to Services
        </button>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}

      {error && <p className="text-center text-red-400 py-16">{error}</p>}

      {!loading && !error && (
        <>
          <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
              {staff.map((member) => {
                const displayName = member.user_name ?? member.name ?? 'Stylist'
                const photo       = photoUrl(member.photo)
                return (
                <motion.div
                  key={member.id}
                  variants={item}
                  onClick={() => onSelect(member)}
                  whileHover={{ y: -4 }}
                  className="relative p-6 rounded-2xl border cursor-pointer group text-center overflow-hidden transition-all duration-300"
                  style={{
                    background:   booking.staff?.id === member.id
                      ? 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.06))'
                      : 'rgba(255,255,255,0.03)',
                    borderColor:  booking.staff?.id === member.id ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.08), transparent 60%)' }}
                  />

                  {booking.staff?.id === member.id && (
                    <span
                      className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full tracking-widest uppercase font-semibold"
                      style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                    >
                      Selected
                    </span>
                  )}

                  <div className="flex justify-center mb-4">
                    {photo ? (
                      <img
                        src={photo}
                        alt={displayName}
                        className="w-20 h-20 rounded-full object-cover border-2"
                        style={{ borderColor: 'var(--gold)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
                      />
                    ) : null}
                    <div
                      className="w-20 h-20 rounded-full items-center justify-center text-xl font-bold text-white border-2"
                      style={{
                        background: avatarGradient(member.id),
                        borderColor: 'rgba(201,169,110,0.4)',
                        display: photo ? 'none' : 'flex',
                      }}
                    >
                      {initials(displayName)}
                    </div>
                  </div>

                  <h3 className="text-white font-semibold text-base mb-1">{displayName}</h3>
                  {member.role && (
                    <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>
                      {member.role}
                    </p>
                  )}
                  {member.bio && (
                    <p className="text-white/40 text-xs leading-relaxed line-clamp-3">{member.bio}</p>
                  )}

                  <div
                    className="mt-4 text-[11px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ color: 'var(--gold)' }}
                  >
                    Book with {displayName.split(' ')[0]} →
                  </div>
                </motion.div>
                )
              })}
          </motion.div>

          {staff.length === 0 && (
            <p className="text-center text-white/30 py-16">
              No stylists available for this service right now.
            </p>
          )}
        </>
      )}
    </div>
  )
}
