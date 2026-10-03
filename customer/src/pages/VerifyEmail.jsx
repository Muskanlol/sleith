import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authApi } from '../api/auth.api'
import AuthLayout from '../components/layout/AuthLayout'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('verifying')
  const [errorDetail, setErrorDetail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorDetail('No token was found in this URL. Please use the exact link from your email.')
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          'This link may be invalid or has already been used.'
        setErrorDetail(msg)
      })
  }, [token])

  return (
    <AuthLayout>
      <div className="py-4 text-center">
        {status === 'verifying' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="text-sm text-auth-muted tracking-wide">Verifying your email address…</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ border: '1px solid rgba(201,169,110,0.45)', background: 'rgba(201,169,110,0.1)' }}
            >
              <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2
              className="font-display mb-3 text-2xl font-semibold text-auth-text"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Email Verified
            </h2>
            <p className="mb-8 text-sm text-auth-muted">
              Your account is now active. You can sign in and start booking.
            </p>

            <Link
              to="/login"
              className="btn-gold-shimmer inline-flex w-full items-center justify-center rounded-md py-3 text-sm font-semibold tracking-wide"
            >
              Sign In
            </Link>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)' }}
            >
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h2
              className="font-display mb-3 text-2xl font-semibold text-auth-text"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Verification Failed
            </h2>
            <p className="mb-2 text-sm text-auth-muted">{errorDetail}</p>
            <p className="mb-8 text-xs text-auth-muted">
              Verification links expire after 24 hours.
            </p>

            <Link
              to="/login"
              className="btn-gold-shimmer inline-flex w-full items-center justify-center rounded-md py-3 text-sm font-semibold tracking-wide"
            >
              Go to Login
            </Link>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  )
}
