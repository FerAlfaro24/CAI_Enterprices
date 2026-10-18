import { useSyncExternalStore } from 'react'

const snapshot = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const subscribe = (notify: () => void) => {
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

/** Read the live preference, including changes between render and subscription. */
export function useGalleryMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true)
}
