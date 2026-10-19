import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'cai.demo.theme.v1'
export const LEGACY_THEME_KEY = 'cai.community.demo.theme.v1'
export const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null)

export function useAppTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('El tema requiere ThemeProvider.')
  return value
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* El selector funciona también sin almacenamiento. */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
