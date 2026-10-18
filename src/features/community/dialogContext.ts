import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

export interface PostDetail { postId: string; comments: boolean }

export const CommunityDialogContext = createContext<{
  profileId: string | null
  setProfileId: Dispatch<SetStateAction<string | null>>
  detail: PostDetail | null
  setDetail: Dispatch<SetStateAction<PostDetail | null>>
} | null>(null)

export function useCommunityDialogs() {
  const context = useContext(CommunityDialogContext)
  if (!context) throw new Error('Los diálogos requieren CommunityProvider.')
  return context
}
