import { useReducer, type ReactNode } from 'react'
import { CommunityContext } from './context'
import { communityReducer, createInitialState } from './model'

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(communityReducer, undefined, createInitialState)
  return <CommunityContext.Provider value={{ state, dispatch }}>{children}</CommunityContext.Provider>
}
