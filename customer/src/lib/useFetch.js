import { useState, useEffect, useRef, useCallback } from 'react'

export function useFetch(apiFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const apiFnRef = useRef(apiFn)
  apiFnRef.current = apiFn

  const run = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    apiFnRef.current()
      .then((res) => {
        if (!cancelled) {
          setData(res.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.detail || err?.message || 'Something went wrong.')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, deps)

  useEffect(() => {
    const cancel = run()
    return cancel
  }, [run])

  return { data, loading, error, refetch: run }
}
