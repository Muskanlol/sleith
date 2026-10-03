import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth.api'
import { extractErrorMessages } from '../../components/common/FormError'
import StaffAvatar from '../../components/common/StaffAvatar'

function LuxField({ label, value, onChange, type = 'text', readOnly = false, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium tracking-[0.18em] text-text-secondary uppercase">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`w-full rounded-md border bg-card-bg px-4 py-3 text-sm text-text-primary outline-none transition-colors duration-200 ${
          readOnly
            ? 'cursor-default border-card-border text-text-secondary'
            : 'border-card-border focus:border-gold'
        }`}
      />
      {hint && <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}

export default function Profile() {
  const { user, refreshProfile } = useAuth()

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  })
  const [errors, setErrors]   = useState([])
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const [pw, setPw] = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState([])
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const photoInputRef = useRef(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState(false)

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    setPhotoSuccess(false)
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5 MB.')
      return
    }
    const fd = new FormData()
    fd.append('photo', file)
    setPhotoLoading(true)
    try {
      await authApi.updateMe(fd)
      await refreshProfile()
      setPhotoSuccess(true)
    } catch (err) {
      setPhotoError(extractErrorMessages(err)[0] || 'Could not upload photo.')
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors([])
    setSuccess(false)
    setLoading(true)
    try {
      await authApi.updateMe(form)
      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setErrors(extractErrorMessages(err))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwErrors([])
    setPwSuccess(false)

    const nextErrors = []
    if (!pw.old_password) nextErrors.push('Current password is required.')
    if (pw.new_password.length < 8) nextErrors.push('New password must be at least 8 characters.')
    if (!/[A-Za-z]/.test(pw.new_password)) nextErrors.push('New password must contain at least one letter.')
    if (!/[0-9]/.test(pw.new_password)) nextErrors.push('New password must contain at least one number.')
    if (pw.new_password !== pw.confirm) nextErrors.push('New passwords do not match.')
    if (pw.old_password && pw.old_password === pw.new_password) nextErrors.push('New password must be different from the current one.')
    if (nextErrors.length) {
      setPwErrors(nextErrors)
      return
    }

    setPwLoading(true)
    try {
      await authApi.changePassword(pw.old_password, pw.new_password)
      setPw({ old_password: '', new_password: '', confirm: '' })
      setPwSuccess(true)
    } catch (err) {
      setPwErrors(extractErrorMessages(err))
    } finally {
      setPwLoading(false)
    }
  }

  const role = user?.role ?? 'CUSTOMER'
  const roleBadge = {
    CUSTOMER: { label: 'Customer', bg: 'rgba(201,169,110,0.10)', border: 'rgba(201,169,110,0.30)', color: '#A88550' },
    STAFF:    { label: 'Staff',    bg: 'rgba(30,122,52,0.10)',   border: 'rgba(30,122,52,0.30)',   color: '#1A6E35' },
    MANAGER:  { label: 'Manager',  bg: 'rgba(30,122,52,0.10)',   border: 'rgba(30,122,52,0.30)',   color: '#1A6E35' },
  }
  const badge = roleBadge[role] ?? roleBadge.CUSTOMER

  return (
    <div>
      <section
        className="relative overflow-hidden px-4 py-16"
        style={{
          background:
            'linear-gradient(160deg, #111009 0%, #1C1709 55%, #111009 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(201,169,110,0.09) 0%, transparent 65%)',
          }}
        />

        <div className="relative mx-auto max-w-4xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <StaffAvatar
                name={user?.full_name || 'You'}
                photo={user?.photo_url || null}
                size="xl"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoLoading}
                className="absolute -bottom-1 -right-1 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase disabled:opacity-60"
                style={{ background: '#C9A96E', color: '#1A1406' }}
              >
                {photoLoading ? '…' : user?.photo_url ? 'Change' : 'Upload'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoPick}
              />
            </div>
            <div>
            <p className="mb-2 text-[10px] font-medium tracking-[0.45em] text-gold/55 uppercase">
              My Account
            </p>

            <h1
              className="text-3xl font-semibold text-white md:text-4xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {user?.full_name || 'Welcome'}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-sm text-white/45">{user?.email}</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
              >
                {badge.label}
              </span>
              {user?.is_email_verified && (
                <span className="flex items-center gap-1 text-[11px] text-success">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            {(photoError || photoSuccess) && (
              <p className={`mt-2 text-xs ${photoError ? 'text-red-300' : 'text-emerald-300'}`}>
                {photoError || 'Photo updated — it will appear on your reviews.'}
              </p>
            )}
            </div>
          </div>

          <div className="flex gap-6">
            {[
              { label: 'Member since', value: user?.date_joined ? new Date(user.date_joined).getFullYear() : '—' },
              { label: 'Status', value: user?.is_active ? 'Active' : 'Inactive' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-xl font-semibold text-gold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] tracking-[0.2em] text-white/35 uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div
        className="h-10"
        style={{ background: 'linear-gradient(to bottom, #111009, #FAF8F3)' }}
      />

      <div className="bg-page-bg px-4 pb-20">
        <div className="mx-auto max-w-4xl">

          <div className="mb-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
            <h2
              className="text-sm font-medium tracking-[0.25em] text-text-secondary uppercase"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Profile Details
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/30 to-transparent" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-card-border bg-card-bg p-8 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <LuxField
                label="Full Name"
                value={form.full_name}
                onChange={handleChange('full_name')}
              />

              <LuxField
                label="Email"
                value={user?.email || ''}
                readOnly
                hint="Contact support to change your email address."
              />

              <LuxField
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                hint="Used for appointment reminders."
              />

              <LuxField
                label="Account Role"
                value={badge.label}
                readOnly
              />
            </div>

            {errors.length > 0 && (
              <div className="mt-5 rounded-lg border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
                {errors.map((msg, i) => <p key={i}>{msg}</p>)}
              </div>
            )}
            {success && (
              <div className="mt-5 rounded-lg border px-4 py-3 text-sm"
                   style={{ borderColor: 'rgba(26,110,53,0.25)', background: 'rgba(26,110,53,0.05)', color: '#1A6E35' }}>
                ✓ Profile updated successfully.
              </div>
            )}

            <div className="my-6 h-px bg-gradient-to-r from-gold/20 via-card-border to-transparent" />

            <div className="flex items-center justify-between">
              <p className="text-xs text-text-secondary">
                Joined{' '}
                {user?.date_joined
                  ? new Date(user.date_joined).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
              <button
                type="submit"
                disabled={loading}
                className="btn-gold-shimmer inline-flex items-center gap-2 rounded-md px-7 py-2.5 text-sm font-semibold tracking-wide disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>

          <form
            onSubmit={handlePasswordSubmit}
            className="mt-5 rounded-xl border p-6 md:p-8"
            style={{ borderColor: '#E2D9CE', background: '#FFFFFF' }}
          >
            <h3
              className="mb-1 text-base font-semibold text-text-primary"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Change password
            </h3>
            <p className="mb-5 text-sm text-text-secondary">
              Use a strong password with letters and numbers. You will stay signed in after updating.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <LuxField
                label="Current password"
                type="password"
                value={pw.old_password}
                onChange={(e) => { setPw((p) => ({ ...p, old_password: e.target.value })); setPwSuccess(false) }}
              />
              <LuxField
                label="New password"
                type="password"
                value={pw.new_password}
                onChange={(e) => { setPw((p) => ({ ...p, new_password: e.target.value })); setPwSuccess(false) }}
              />
              <LuxField
                label="Confirm new password"
                type="password"
                value={pw.confirm}
                onChange={(e) => { setPw((p) => ({ ...p, confirm: e.target.value })); setPwSuccess(false) }}
              />
            </div>

            {pwErrors.length > 0 && (
              <div className="mt-4 rounded-lg border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
                {pwErrors.map((msg, i) => <p key={i}>{msg}</p>)}
              </div>
            )}
            {pwSuccess && (
              <div className="mt-4 rounded-lg border px-4 py-3 text-sm"
                   style={{ borderColor: 'rgba(26,110,53,0.25)', background: 'rgba(26,110,53,0.05)', color: '#1A6E35' }}>
                ✓ Password updated.
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-4">
              <Link to="/forgot-password" className="text-xs text-text-secondary hover:text-gold">
                Forgot your password instead?
              </Link>
              <button
                type="submit"
                disabled={pwLoading}
                className="btn-gold-shimmer inline-flex items-center gap-2 rounded-md px-7 py-2.5 text-sm font-semibold tracking-wide disabled:opacity-50"
              >
                {pwLoading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>

          {[
            { title: 'My Appointments',  desc: 'View upcoming bookings, history and pay pending bills.',  href: '/account/appointments' },
            { title: 'My Packages',      desc: 'See remaining sessions, expiry dates and usage history.', href: '/account/packages'     },
            { title: 'My Applications',  desc: 'Track the status of your academy course applications.',   href: '/account/applications' },
            { title: 'My Academy',       desc: 'Enrollments, attendance, results and certificates.',     href: '/account/academy' },
            { title: 'Academy Fees',     desc: 'Track and pay your course fee instalments.',              href: '/account/academy-fees' },
          ].map(({ title, desc, href }) => (
            <div key={href}
              className="mt-4 flex items-center justify-between rounded-xl border p-6"
              style={{ borderColor: '#E2D9CE', background: '#FFFFFF' }}>
              <div>
                <h3 className="mb-1 text-base font-semibold text-text-primary"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {title}
                </h3>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
              <Link to={href} className="whitespace-nowrap text-sm font-medium text-gold transition-colors hover:text-gold-hover">
                View →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
