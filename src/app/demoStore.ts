import { createContext, useContext } from 'react'
import type { AdminAction, AdminState } from '../features/admin/state'

export type DemoStore = { state: AdminState; dispatch: (action: AdminAction) => void }

/**
 * Estado compartido de la demostración (solicitudes, publicaciones, alumnos).
 * Vive en memoria: se pierde al recargar y no es una base de datos ni una
 * autorización real.
 */
export const DemoStoreContext = createContext<DemoStore | null>(null)

export function useDemoStore() {
  const store = useContext(DemoStoreContext)
  if (!store) throw new Error('useDemoStore debe usarse dentro de DemoStoreProvider.')
  return store
}
