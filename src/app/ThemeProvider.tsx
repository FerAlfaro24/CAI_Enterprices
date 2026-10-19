import { useLayoutEffect, useState, type ReactNode } from 'react'
import { LEGACY_THEME_KEY, readTheme, THEME_KEY, ThemeContext } from './theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(readTheme)
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
      localStorage.removeItem(LEGACY_THEME_KEY)
    } catch { /* Se conserva el tema en memoria durante la visita. */ }
  }, [theme])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
