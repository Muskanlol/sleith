import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useFetch } from '../lib/useFetch'
import { salonApi } from '../api/salon.api'
import { bookingApi, loadRazorpay } from '../api/booking.api'
import { useAuth } from '../context/AuthContext'
import SectionHero from '../components/common/SectionHero'
import { Reveal, StaggerReveal } from '../components/common/Reveal'
import { LoadingGrid, ErrorState, EmptyState } from '../components/common/PageStates'

const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

const TIER = {
  classic: {
    label: 'Classic',
    border: 'rgba(201,169,110,0.2)',    hoverBorder: 'rgba(201,169,110,0.5)',
    badge:  { bg: 'rgba(201,169,110,0.1)',  color: '#C9A96E', border: 'rgba(201,169,110,0.25)' },
    glow:   'rgba(201,169,110,0.07)',
  },
  premium: {
    label: 'Premium',
    border: 'rgba(201,169,110,0.35)',   hoverBorder: '#C9A96E',
    badge:  { bg: 'rgba(201,169,110,0.2)',  color: '#EDD9A3', border: 'rgba(201,169,110,0.45)' },
    glow:   'rgba(201,169,110,0.12)',
  },
  exclusive: {
    label: 'Exclusive',
    border: 'rgba(237,217,163,0.3)',    hoverBorder: '#EDD9A3',
    badge:  { bg: 'rgba(237,217,163,0.15)', color: '#EDD9A3', border: 'rgba(237,217,163,0.4)'  },
    glow:   'rgba(237,217,163,0.1)',
  },
}

function getTier(pkg) {
  const type = (pkg.package_type || '').toLowerCase()
  if (type.includes('exclusive') || type.includes('platinum')) return TIER.exclusive
  if (type.includes('premium')   || type.includes('gold'))     return TIER.premium
  return TIER.classic
}

function PackageCard({ pkg }) {
  const tier                    = getTier(pkg)
  const { isAuthenticated, user } = useAuth()
  const navigate                = useNavigate()
  const [buying,  setBuying]    = useState(false)
  const [buyDone, setBuyDone]   = useState(false)
  const [buyErr,  setBuyErr]    = useState(null)

  const handleBuy = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setBuying(true); setBuyErr(null)
    try {
      const { data: order } = await bookingApi.createPaymentOrder({
        payment_for: 'PACKAGE',
        package_id:  pkg.id,
      })
      const Rzp = await loadRazorpay()
      new Rzp({
        key:         KEY,
        amount:      order.amount,
        currency:    order.currency ?? 'INR',
        order_id:    order.order_id ?? order.razorpay_order_id,
        name:        'SLEITH',
        description: pkg.name,
        handler: async (res) => {
          try {
            await bookingApi.verifyPayment(res)
            setBuyDone(true)
          } catch {
            setBuyErr('Payment verification failed. Contact support.')
          }
        },
        prefill: { name: user?.full_name ?? '', email: user?.email ?? '' },
        theme:   { color: '#c9a96e' },
        modal:   { ondismiss: () => setBuying(false) },
      }).open()
    } catch (err) {
      setBuyErr(err?.response?.data?.error ?? 'Could not process payment. Try again.')
      setBuying(false)
    }
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl p-7 transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'rgba(20,16,6,0.92)', border: `1px solid ${tier.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = tier.hoverBorder)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = tier.border)}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${tier.glow} 0%, transparent 70%)` }} />

      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="rounded-full px-3 py-0.5 text-[10px] font-medium tracking-[0.15em] uppercase"
          style={{ background: tier.badge.bg, color: tier.badge.color, border: `1px solid ${tier.badge.border}` }}>
          {tier.label}
        </span>
        {pkg.validity_days && (
          <span className="text-[10px] text-white/30">{pkg.validity_days}d validity</span>
        )}
      </div>

      <h3 className="mb-2 text-2xl font-semibold leading-tight text-white transition-colors duration-200 group-hover:text-gold"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {pkg.name}
      </h3>

      {pkg.description && (
        <p className="mb-5 text-sm leading-relaxed text-white/40">{pkg.description}</p>
      )}

      {pkg.benefits?.length > 0 && (
        <ul className="mb-6 flex flex-col gap-2">
          {pkg.benefits.map((b) => (
            <li key={b.id} className="flex items-center gap-2 text-[13px] text-white/50">
              <span className="h-1 w-1 flex-shrink-0 rotate-45" style={{ background: '#C9A96E' }} />
              {b.service_name}
              {b.quantity > 1 && <span className="ml-auto text-[11px] text-gold/40">×{b.quantity}</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-5" style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }}>
        {pkg.price && (
          <p className="mb-4 text-2xl font-semibold text-gold">
            ₹{Number(pkg.price).toLocaleString('en-IN')}
          </p>
        )}

        {buyDone ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full py-2.5 rounded-md text-sm font-semibold tracking-wide text-center"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}>
            ✓ Purchase Successful! <Link to="/account/packages" className="underline ml-1">View Package →</Link>
          </motion.div>
        ) : (
          <>
            <Link
              to={`/packages/${pkg.id}`}
              className="inline-flex w-full items-center justify-center rounded-md py-2.5 text-sm font-medium tracking-wide border mb-2 transition-all hover:border-white/30"
              style={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              View Details
            </Link>
            <button
              onClick={handleBuy}
              disabled={buying}
              className="btn-gold-shimmer inline-flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold tracking-wide disabled:opacity-60 transition-all"
            >
              {buying ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg> Opening…</>
              ) : isAuthenticated ? '💳 Buy Now' : '🔐 Login to Purchase'}
            </button>
            {buyErr && <p className="mt-2 text-xs text-red-400 text-center">{buyErr}</p>}
          </>
        )}
      </div>
    </div>
  )
}

export default function Packages() {
  const { data: packages, loading, error, refetch } = useFetch(() => salonApi.getPackages())
  const activePackages = (packages || []).filter((p) => p.is_active !== false)

  return (
    <div style={{ background: 'linear-gradient(180deg, #0B0907 0%, #111009 60%, #0D0B05 100%)' }}>
      <SectionHero
        eyebrow="CURATED PACKAGES"
        title={<>Packages & <span className="text-gold">Value</span></>}
        subtitle="Handpicked bundles that give you more of what you love — at the pace you choose."
        variant="gold"
      />

      <section className="mx-auto max-w-6xl px-4 py-16">
        {loading && <LoadingGrid count={3} />}
        {error   && <ErrorState msg={error} onRetry={refetch} />}

        {!loading && !error && (
          <>
            {activePackages.length === 0 ? (
              <EmptyState msg="Packages are being curated. Please check back soon." />
            ) : (
              <StaggerReveal className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activePackages.map((p) => <PackageCard key={p.id} pkg={p} onViewDetail={() => {}} />)}
              </StaggerReveal>
            )}

            <Reveal delay={0.1} className="mt-16 flex flex-col items-center gap-3 text-center">
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <p className="text-sm text-white/40">Already purchased? View your active packages.</p>
              <Link to="/account/packages"
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--gold)' }}>
                My Packages →
              </Link>
            </Reveal>
          </>
        )}
      </section>
    </div>
  )
}
