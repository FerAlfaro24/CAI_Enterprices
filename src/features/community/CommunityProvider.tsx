import { useReducer, useState, type ReactNode } from 'react'
import { CommunityContext } from './context'
import { communityReducer, createInitialState } from './model'
import { CommunityDialogContext, type PostDetail } from './dialogContext'

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(communityReducer, undefined, createInitialState)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [detail, setDetail] = useState<PostDetail | null>(null)
  return <CommunityContext.Provider value={{ state, dispatch }}><CommunityDialogContext.Provider value={{ profileId, setProfileId, detail, setDetail }}>{children}</CommunityDialogContext.Provider></CommunityContext.Provider>
}
