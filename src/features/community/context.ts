import { createContext, useContext, type Dispatch } from 'react'
import type { CommunityAction, CommunityState } from './types'

export const CommunityContext = createContext<{ state: CommunityState; dispatch: Dispatch<CommunityAction> } | null>(null)

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('La comunidad requiere CommunityProvider.')
  return context
}
