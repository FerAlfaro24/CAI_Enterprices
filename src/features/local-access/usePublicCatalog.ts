import { useCallback, useEffect, useRef, useState } from 'react'
import { catalogApi, type PublicCatalog } from './api'

export function usePublicCatalog(enabled: boolean) {
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null), [error, setError] = useState('')
  const generation = useRef(0)
  const refresh = useCallback(() => {
    const current = ++generation.current
    return catalogApi.get().then(catalog => { if (generation.current === current) { setCatalog(catalog); setError('') } })
      .catch((error: unknown) => { if (generation.current === current) setError(error instanceof Error ? error.message : 'No pudimos cargar los grupos.') })
  }, [])
  useEffect(() => {
    const sequence = generation
    if (!enabled) return
    void refresh()
    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    return () => { sequence.current++; window.removeEventListener('focus', onFocus) }
  }, [enabled, refresh])
  return { catalog, error, refresh }
}
