export default function AuthField({
  label,
  type = 'text',
  registration,
  error,
  hint,
  rightElement,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-xs font-medium tracking-[0.12em] text-auth-muted uppercase">
          {label}
        </label>
        {rightElement}
      </div>

      <input
        type={type}
        className={`w-full rounded-md border bg-[#0E0C0A] px-4 py-3 text-sm text-auth-text placeholder-auth-muted/40 outline-none transition-colors duration-200 ${
          error
            ? 'border-red-500/60 focus:border-red-400'
            : 'border-auth-border focus:border-gold'
        }`}
        {...registration}
        {...props}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-400 leading-snug">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-auth-muted leading-snug">{hint}</p>
      )}
    </div>
  )
}
