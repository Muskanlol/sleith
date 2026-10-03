import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'

import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/layout/AuthLayout'
import AuthField from '../components/common/AuthField'
import { AuthFormError, extractErrorMessages } from '../components/common/FormError'
import { usePostAuthPath, withNext } from '../lib/authRedirect'

const RegisterSchema = z
  .object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  })

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const next = usePostAuthPath()

  const [apiErrors, setApiErrors] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(RegisterSchema) })

  const onSubmit = async (data) => {
    setApiErrors([])
    try {
      await registerUser(data)
      setSubmittedEmail(data.email)
      setSubmitted(true)
    } catch (err) {
      setApiErrors(extractErrorMessages(err))
    }
  }

  if (submitted) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
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
            Check your inbox
          </h2>
          <p className="mb-1 text-sm text-auth-muted">
            A verification link has been sent to
          </p>
          <p className="mb-6 text-sm font-medium text-auth-text">{submittedEmail}</p>
          <p className="mb-8 text-sm text-auth-muted">
            Click the link in the email to activate your account, then log in to continue.
          </p>

          <button
            onClick={() => navigate(withNext('/login', next))}
            className="btn-gold-shimmer w-full rounded-md py-3 text-sm font-semibold tracking-wide"
          >
            Go to Login
          </button>

          <p className="mt-5 text-xs text-auth-muted">
            Didn&apos;t receive it? Check spam or{' '}
            <button
              onClick={() => setSubmitted(false)}
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
          Create your account
        </h2>
        <p className="mt-1.5 text-sm text-auth-muted">
          Book services, buy packages, and apply to Academy courses.
        </p>
      </div>

      <AuthFormError messages={apiErrors} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
        <AuthField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Smith"
          registration={register('full_name')}
          error={errors.full_name?.message}
        />

        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          registration={register('email')}
          error={errors.email?.message}
        />

        <AuthField
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          registration={register('phone')}
          error={errors.phone?.message}
          hint="Optional — used for appointment reminders."
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          registration={register('password')}
          error={errors.password?.message}
        />

        <AuthField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          registration={register('password_confirm')}
          error={errors.password_confirm?.message}
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
              Creating account…
            </span>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-auth-border" />
        <span className="text-xs text-auth-muted">or</span>
        <div className="h-px flex-1 bg-auth-border" />
      </div>

      <p className="text-center text-sm text-auth-muted">
        Already have an account?{' '}
        <Link to={withNext('/login', next)} className="font-medium text-gold transition-colors hover:text-gold-hover">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
