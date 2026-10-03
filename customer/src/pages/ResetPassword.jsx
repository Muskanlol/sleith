import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'

import { authApi } from '../api/auth.api'
import AuthLayout from '../components/layout/AuthLayout'
import AuthField from '../components/common/AuthField'
import { AuthFormError, extractErrorMessages } from '../components/common/FormError'

const ResetSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain at least one letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [apiErrors, setApiErrors] = useState([])
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(ResetSchema) })

  const onSubmit = async (data) => {
    if (!token) {
      setApiErrors([
        'This reset link is missing its token. Please use the exact link from your email.',
      ])
      return
    }
    setApiErrors([])
    try {
      await authApi.resetPassword(token, data.new_password)
      setDone(true)
    } catch (err) {
      setApiErrors(extractErrorMessages(err))
    }
  }

  if (done) {
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
            <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2
            className="font-display mb-3 text-2xl font-semibold text-auth-text"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Password Updated
          </h2>
          <p className="mb-8 text-sm text-auth-muted">
            Your password has been reset. You can now sign in with your new credentials.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="btn-gold-shimmer w-full rounded-md py-3 text-sm font-semibold tracking-wide"
          >
            Sign In
          </button>
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
          Set New Password
        </h2>
        <p className="mt-1.5 text-sm text-auth-muted">
          Choose a strong password for your account.
        </p>
      </div>

      {!token && (
        <div className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          No reset token found. Please use the link from your email.
        </div>
      )}

      <AuthFormError messages={apiErrors} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
        <AuthField
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          registration={register('new_password')}
          error={errors.new_password?.message}
        />

        <AuthField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat new password"
          registration={register('confirm')}
          error={errors.confirm?.message}
        />

        <motion.button
          type="submit"
          disabled={isSubmitting || !token}
          whileTap={{ scale: 0.985 }}
          className="btn-gold-shimmer mt-1 w-full rounded-md py-3 text-sm font-semibold tracking-wide disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Updating…
            </span>
          ) : (
            'Update Password'
          )}
        </motion.button>
      </form>

      <div className="mt-7 text-center">
        <Link to="/login" className="text-sm text-gold/70 transition-colors hover:text-gold">
          ← Back to login
        </Link>
      </div>
    </AuthLayout>
  )
}
