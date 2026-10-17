import { Outlet } from 'react-router'
import { MainNavigation } from '../components/MainNavigation'
import { PrototypeNotice } from '../components/PrototypeNotice'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only z-10 rounded-md bg-white p-3 font-medium text-slate-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <PrototypeNotice />
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-950">CAI</p>
            <p className="text-sm text-slate-600">
              Centro de Asesorías Integrales
            </p>
          </div>
          <MainNavigation />
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
      >
        <Outlet />
      </main>
      <footer className="border-t border-slate-300 bg-white px-4 py-5 sm:px-6">
        <p className="mx-auto max-w-5xl text-sm text-slate-600">
          CAI · Demostración local. No introducir datos personales reales.
        </p>
      </footer>
    </div>
  )
}
