import { createContext, useContext, type Dispatch } from 'react'
import type { CommunityAction, CommunityState } from './types'
import type { CommunityConnection } from './connection'

export const CommunityContext = createContext<{ state: CommunityState; dispatch: Dispatch<CommunityAction>; connection?: CommunityConnection } | null>(null)

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('La comunidad requiere CommunityProvider.')
  return context
}
