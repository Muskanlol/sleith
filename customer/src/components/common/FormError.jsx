export function extractErrorMessages(error) {
  const data = error?.response?.data
  if (!data) return [error?.message || 'Something went wrong. Please try again.']

  if (typeof data === 'string') return [data]
  if (data.detail) return [data.detail]
  if (data.error) return [data.error]
  if (data.message) return [data.message]

  const messages = []
  for (const [field, value] of Object.entries(data)) {
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    messages.push(field === 'non_field_errors' ? text : `${field}: ${text}`)
  }
  return messages.length ? messages : ['Something went wrong. Please try again.']
}

export default function FormError({ messages }) {
  if (!messages || messages.length === 0) return null
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/25 bg-danger/8 px-4 py-3 text-sm text-danger"
    >
      {messages.map((msg, i) => (
        <p key={i} className="leading-snug">
          {msg}
        </p>
      ))}
    </div>
  )
}

export function AuthFormError({ messages }) {
  if (!messages || messages.length === 0) return null
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400"
    >
      {messages.map((msg, i) => (
        <p key={i} className="leading-snug">
          {msg}
        </p>
      ))}
    </div>
  )
}
