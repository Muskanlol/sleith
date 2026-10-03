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

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const from = usePostAuthPath()

  const [apiErrors, setApiErrors] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(LoginSchema) })

  const onSubmit = async (data) => {
    setApiErrors([])
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setApiErrors(extractErrorMessages(err))
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <h2
          className="font-display text-2xl font-semibold text-auth-text"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-auth-muted">
          Sign in to book appointments &amp; manage your account.
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

        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          registration={register('password')}
          error={errors.password?.message}
          rightElement={
            <Link
              to={withNext('/forgot-password', from)}
              className="text-xs text-gold/70 transition-colors hover:text-gold"
            >
              Forgot password?
            </Link>
          }
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
              Signing in…
            </span>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-auth-border" />
        <span className="text-xs text-auth-muted">or</span>
        <div className="h-px flex-1 bg-auth-border" />
      </div>

      <p className="text-center text-sm text-auth-muted">
        Don&apos;t have an account?{' '}
        <Link to={withNext('/register', from)} className="font-medium text-gold transition-colors hover:text-gold-hover">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
