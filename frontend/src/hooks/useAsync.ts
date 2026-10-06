import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { errorMessage } from '@/lib/http'

/** Loads data once per dependency change; `reload()` refetches without showing the spinner again. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const run = useCallback(async (silent: boolean) => {
    if (!silent) setLoading(true)
    try {
      const result = await loaderRef.current()
      setData(result)
      setError(null)
      return result
    } catch (err) {
      setError(errorMessage(err))
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    run(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const reload = useCallback(() => run(true), [run])
  return { data, setData, error, loading, reload }
}

/** Calls `tick` every `ms` while the tab is visible. */
export function usePolling(tick: () => void, ms: number, enabled = true) {
  const tickRef = useRef(tick)
  tickRef.current = tick
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') tickRef.current()
    }, ms)
    return () => clearInterval(id)
  }, [ms, enabled])
}
