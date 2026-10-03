import { useLocation, useSearchParams } from 'react-router-dom'

const DEFAULT_AFTER_AUTH = '/account'

export function safeNextPath(value) {
  if (typeof value !== 'string') return null
  const path = value.trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return null
  return path
}

export function withNext(path, next) {
  const safe = safeNextPath(next)
  if (!safe || safe === DEFAULT_AFTER_AUTH) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}next=${encodeURIComponent(safe)}`
}

export function usePostAuthPath() {
  const location = useLocation()
  const [params] = useSearchParams()
  const fromQuery = safeNextPath(params.get('next'))
  const fromState = location.state?.from
  const fromPath =
    typeof fromState === 'string'
      ? safeNextPath(fromState)
      : safeNextPath(fromState?.pathname)
  return fromQuery || fromPath || DEFAULT_AFTER_AUTH
}
