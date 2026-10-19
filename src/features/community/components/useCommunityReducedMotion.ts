import { useSyncExternalStore } from 'react'

const snapshot = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const subscribe = (notify: () => void) => {
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

/** Live presentation preference for Retos and Logros; no domain state. */
export function useCommunityReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true)
}
