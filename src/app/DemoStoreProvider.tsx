import { useMemo, useReducer, type ReactNode } from 'react'
import { adminReducer, initialAdminState } from '../features/admin/state'
import { DemoStoreContext } from './demoStore'

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialAdminState)
  const store = useMemo(() => ({ state, dispatch }), [state])
  return <DemoStoreContext value={store}>{children}</DemoStoreContext>
}
