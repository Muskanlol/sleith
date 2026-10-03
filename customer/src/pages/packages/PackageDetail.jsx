import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useFetch } from '../../lib/useFetch'
import { salonApi } from '../../api/salon.api'
import { bookingApi, loadRazorpay } from '../../api/booking.api'
import { useAuth } from '../../context/AuthContext'

const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

const TIER = {
  classic:   { label: 'Classic',   border: 'rgba(201,169,110,0.3)',  glow: 'rgba(201,169,110,0.08)'  },
  premium:   { label: 'Premium',   border: 'rgba(201,169,110,0.5)',  glow: 'rgba(201,169,110,0.14)'  },
  exclusive: { label: 'Exclusive', border: 'rgba(237,217,163,0.5)',  glow: 'rgba(237,217,163,0.12)'  },
}
function getTier(type = '') {
  const t = type.toLowerCase()
  if (t.includes('exclusive') || t.includes('platinum')) return TIER.exclusive
  if (t.includes('premium')   || t.includes('gold'))     return TIER.premium
  return TIER.classic
}

export default function PackageDetail() {
  const { id }                      = useParams()
  const { isAuthenticated, user }   = useAuth()
  const navigate                    = useNavigate()
  const { data: pkg, loading, error } = useFetch(() => salonApi.getPackage(id), [id])

  const [buying,  setBuying]  = useState(false)
  const [buyDone, setBuyDone] = useState(false)
  const [buyErr,  setBuyErr]  = useState(null)

  const tier = getTier(pkg?.package_type)

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
          } catch { setBuyErr('Payment verification failed. Contact support.') }
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#0a0a0a,#110d0a)' }}>
      <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold) transparent var(--gold) var(--gold)' }} />
    </div>
  )

  if (error || !pkg) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'linear-gradient(160deg,#0a0a0a,#110d0a)' }}>
      <p className="text-white/50 text-sm">Package not found.</p>
      <Link to="/packages" className="text-sm font-medium" style={{ color: 'var(--gold)' }}>← Back to Packages</Link>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0a0a 0%,#110d0a 60%,#0d0a11 100%)' }}>
      <div className="pt-28 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/packages" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase transition-colors mb-8"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            ← All Packages
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4,0,0.2,1] }}
          className="rounded-3xl border overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', borderColor: tier.border }}
        >
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${tier.border}, transparent)` }} />

          <div className="p-8 md:p-12">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-medium mb-3 block" style={{ color: 'var(--gold)' }}>
                  {tier.label} Package
                </span>
                <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight">{pkg.name}</h1>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-serif text-4xl font-semibold" style={{ color: 'var(--gold)' }}>
                  ₹{Number(pkg.price).toLocaleString('en-IN')}
                </p>
                {pkg.validity_days && (
                  <p className="text-white/30 text-xs mt-1">{pkg.validity_days} days validity</p>
                )}
              </div>
            </div>

            {pkg.description && (
              <p className="text-white/50 text-base leading-relaxed mb-8 pb-8"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {pkg.description}
              </p>
            )}

            {pkg.benefits?.length > 0 && (
              <div className="mb-10">
                <p className="text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--gold)' }}>
                  What's Included
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pkg.benefits.map((b) => (
                    <div key={b.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--gold)' }} />
                        <span className="text-white/80 text-sm">{b.service_name}</span>
                      </div>
                      {b.quantity > 1 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)' }}>
                          ×{b.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {buyDone ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 py-3.5 rounded-full text-sm font-semibold tracking-widest uppercase text-center"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}>
                  ✓ Purchase Successful!{' '}
                  <Link to="/account/packages" className="underline">View My Packages →</Link>
                </motion.div>
              ) : (
                <>
                  <motion.button
                    onClick={handleBuy}
                    disabled={buying}
                    whileHover={!buying ? { scale: 1.02 } : {}}
                    whileTap={!buying ? { scale: 0.98 } : {}}
                    className="flex-1 py-3.5 rounded-full text-sm font-semibold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                  >
                    {buying
                      ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg> Opening…</>
                      : isAuthenticated ? `💳 Buy — ₹${Number(pkg.price).toLocaleString('en-IN')}` : '🔐 Login to Purchase'
                    }
                  </motion.button>
                  <Link to="/book"
                    className="flex-1 py-3.5 rounded-full text-sm font-medium tracking-widest uppercase text-center border transition-all hover:border-white/30"
                    style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}>
                    Book a Service Instead
                  </Link>
                </>
              )}
            </div>
            {buyErr && <p className="mt-3 text-xs text-red-400 text-center">{buyErr}</p>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
