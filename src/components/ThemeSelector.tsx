import { Moon, Sun } from 'lucide-react'
import { useAppTheme } from '../app/theme'
import s from './themeSelector.module.css'

export function ThemeSelector() {
  const { theme, setTheme } = useAppTheme()
  return <div className={s.selector} role="group" aria-label="Tema de CAI">
    <button type="button" aria-label="Modo claro" aria-pressed={theme === 'light'} onClick={() => setTheme('light')} title="Modo claro"><Sun size={19} aria-hidden="true" /></button>
    <button type="button" aria-label="Modo oscuro" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')} title="Modo oscuro"><Moon size={18} aria-hidden="true" /></button>
  </div>
}
