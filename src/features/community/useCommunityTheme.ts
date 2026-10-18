import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const THEME_KEY = 'cai.community.demo.theme.v1'

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function useCommunityTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Storage may be unavailable. The theme still works during this visit.
    }
  }, [theme])

  return { theme, setTheme }
}
