import { NavLink } from 'react-router'

const navigationItems = [
  { to: '/', label: 'Institucional' },
  { to: '/login', label: 'Acceso demo' },
  { to: '/community', label: 'Comunidad' },
  { to: '/admin', label: 'Administración' },
]

export function MainNavigation() {
  return (
    <nav aria-label="Navegación temporal del prototipo">
      <ul className="flex flex-wrap gap-2">
        {navigationItems.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center rounded-md border px-4 py-2 text-sm font-medium ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
