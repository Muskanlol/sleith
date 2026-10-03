import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'

import { authApi } from '../api/auth.api'
import AuthLayout from '../components/layout/AuthLayout'
import AuthField from '../components/common/AuthField'
import { AuthFormError, extractErrorMessages } from '../components/common/FormError'
import { usePostAuthPath, withNext } from '../lib/authRedirect'

const ForgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPassword() {
  const next = usePostAuthPath()
  const [apiErrors, setApiErrors] = useState([])
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(ForgotSchema) })

  const onSubmit = async (data) => {
    setApiErrors([])
    try {
      await authApi.forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
    } catch (err) {
      const status = err?.response?.status
      if (!status || status >= 500) {
        setApiErrors(['Unable to send email right now. Please try again later.'])
      } else {
        setSentEmail(data.email)
        setSent(true)
      }
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="py-4 text-center"
        >
          <div
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ border: '1px solid rgba(201,169,110,0.45)', background: 'rgba(201,169,110,0.1)' }}
          >
            <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h2
            className="font-display mb-3 text-2xl font-semibold text-auth-text"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Check your email
          </h2>
          <p className="mb-1 text-sm text-auth-muted">
            If an account exists for
          </p>
          <p className="mb-4 text-sm font-medium text-auth-text">{sentEmail}</p>
          <p className="mb-8 text-sm text-auth-muted">
            we&apos;ve sent a password reset link. It expires in 24 hours.
          </p>

          <Link
            to={withNext('/login', next)}
            className="btn-gold-shimmer inline-flex w-full items-center justify-center rounded-md py-3 text-sm font-semibold tracking-wide"
          >
            Back to Login
          </Link>

          <p className="mt-5 text-xs text-auth-muted">
            Didn&apos;t receive it? Check spam or{' '}
            <button
              onClick={() => setSent(false)}
              className="text-gold/70 underline underline-offset-2 hover:text-gold"
            >
              try again
            </button>
            .
          </p>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <h2
          className="font-display text-2xl font-semibold text-auth-text"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Reset Password
        </h2>
        <p className="mt-1.5 text-sm text-auth-muted">
          Enter your email and we&apos;ll send you a secure reset link.
        </p>
      </div>

      <AuthFormError messages={apiErrors} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          registration={register('email')}
          error={errors.email?.message}
        />

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.985 }}
          className="btn-gold-shimmer mt-1 w-full rounded-md py-3 text-sm font-semibold tracking-wide disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sending…
            </span>
          ) : (
            'Send Reset Link'
          )}
        </motion.button>
      </form>

      <div className="mt-7 text-center">
        <Link to={withNext('/login', next)} className="text-sm text-gold/70 transition-colors hover:text-gold">
          ← Back to login
        </Link>
      </div>
    </AuthLayout>
  )
}
